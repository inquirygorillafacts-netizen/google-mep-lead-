"use client";
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    MessageCircle, Send, Users, AlertCircle, 
    Zap, Key, Upload, Paperclip, Smile, X,
    CheckCircle2, Loader2, ChevronDown, ChevronUp, ShieldCheck
} from "lucide-react";
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

export default function CampaignsPage() {
    // State
    const [apiKey, setApiKey] = useState("");
    const [sessionId, setSessionId] = useState("");
    const [availableSessions, setAvailableSessions] = useState<{sessionId: string, status: string, name: string, number: string}[]>([]);
    const [isFetchingSessions, setIsFetchingSessions] = useState(false);
    const [numbersRaw, setNumbersRaw] = useState("");
    const [message, setMessage] = useState("");
    const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
    const [isApiConfigOpen, setIsApiConfigOpen] = useState(false);
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    
    // Media attachment state
    const [mediaFile, setMediaFile] = useState<File | null>(null);
    const [mediaBase64, setMediaBase64] = useState<string | null>(null);
    
    // Emoji picker state
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const emojiPickerRef = useRef<HTMLDivElement>(null);

    // Initialize API Config from Memory/Firestore + Read URL numbers
    useEffect(() => {
        const loadConfig = async () => {
            const savedKey = localStorage.getItem('wa_api_key');
            
            // Check for numbers in URL
            const params = new URLSearchParams(window.location.search);
            const urlNumbers = params.get("numbers");
            if (urlNumbers) {
                setNumbersRaw(urlNumbers.replace(/,/g, "\n"));
                // If we have numbers, maybe the user wants to jump straight to message
                setIsApiConfigOpen(false);
            }

            if (savedKey) {
                setApiKey(savedKey);
                // Only keep closed if numbers exist or key exists
                if (!urlNumbers) setIsApiConfigOpen(false); 
                
                try {
                    const docSnap = await getDoc(doc(db, "api_configs", savedKey));
                    if (docSnap.exists() && docSnap.data().sessionId) {
                        setSessionId(docSnap.data().sessionId);
                    }
                } catch (e) {}
            } else {
                setIsApiConfigOpen(true);
            }
        };
        loadConfig();

        // Exit Guard Logic
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (status === 'sending') {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [status]);

    // Close emoji picker on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
                setShowEmojiPicker(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Handlers
    const handleEmojiClick = (emojiObj: any) => {
        setMessage(prev => prev + emojiObj.emoji);
    };

    const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Check size (< 15MB for base64 limits)
        if (file.size > 15 * 1024 * 1024) {
            alert("File is too large. Maximum size is 15MB.");
            return;
        }

        setMediaFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result?.toString().split(',')[1];
            if (base64String) {
                setMediaBase64(base64String);
            }
        };
        reader.readAsDataURL(file);
    };

    const saveConfig = async () => {
        if (!apiKey) {
            alert("Please enter your X-API-KEY first.");
            return;
        }
        setIsFetchingSessions(true);
        try {
            const response = await fetch('http://localhost:5000/api/v1/sessions', {
                headers: { 'x-api-key': apiKey }
            });
            const data = await response.json();
            if (response.ok && data.sessions) {
                setAvailableSessions(data.sessions);
                if (data.sessions.length === 0) {
                    alert("No active sessions found. Ensure your WhatsApp is connected in the dashboard.");
                } else {
                    if (!sessionId) {
                        const connected = data.sessions.find((s: any) => s.status === 'connected');
                        if (connected) setSessionId(connected.sessionId);
                    }
                    // Auto-close accordion on success to show progress
                    setIsApiConfigOpen(false);
                }
                localStorage.setItem('wa_api_key', apiKey);
            } else {
                alert(`Error: ${data.error || 'Failed to fetch sessions'}`);
            }
        } catch (err) {
            alert("Network Error: Could not connect to the backend server.");
        } finally {
            setIsFetchingSessions(false);
        }
    };

    const handleNumbersUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result;
            if (typeof text === 'string') {
                // Extract possible phone numbers using regex
                const extractedNumbers = text.match(/\d{10,15}/g) || [];
                if (extractedNumbers.length > 0) {
                    setNumbersRaw(prev => {
                        const existing = prev ? prev.trim() + "\n" : "";
                        return existing + extractedNumbers.join("\n");
                    });
                } else {
                    alert("No valid phone numbers found in the file.");
                }
            }
        };
        reader.readAsText(file);
    };

    const startCampaign = async () => {
        if (!apiKey || !sessionId || !numbersRaw || !message) {
            alert("Please fill in API Credentials, Recipient Numbers, and Message Content.");
            return;
        }

        // Save Creds
        try {
            await setDoc(doc(db, "api_configs", apiKey), {
                sessionId,
                updatedAt: serverTimestamp()
            }, { merge: true });
            localStorage.setItem('wa_api_key', apiKey);
        } catch (e) {}

        const numbers = numbersRaw
            .split(/[\n,]/)
            .map(n => n.trim())
            .filter(n => n.length >= 10);

        if (numbers.length === 0) {
            alert("No valid phone numbers found to send messages.");
            return;
        }

        setStatus('sending');

        try {
            const payload = {
                sessionId,
                numbers,
                message,
                media: mediaBase64
            };

            const response = await fetch('http://localhost:5000/api/v1/send', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (response.ok) {
                setTimeout(() => setStatus('success'), 2000); 
                setTimeout(() => setStatus('idle'), 7000);
            } else {
                alert(`Error starting campaign: ${result.error || 'Server error'}`);
                setStatus('error');
            }
        } catch (err) {
            alert("Network Error: Could not connect to the Outreach Engine backend.");
            setStatus('error');
        }
    };

    const confirmExit = () => {
        setStatus('idle');
        setShowExitConfirm(false);
    };

    const removeMedia = () => {
        setMediaFile(null);
        setMediaBase64(null);
    };

    return (
        <div className="min-h-full bg-slate-50 px-4 pt-8 md:pt-12 md:px-12 max-w-6xl w-full mx-auto pb-24">
            
            {/* Header - Premium SaaS Look */}
            <div className="mb-8">
                <div className="flex items-center gap-2 mb-1 text-primary font-black text-[10px] uppercase tracking-widest">
                    <Zap size={14} className="fill-current text-amber-500" />
                    Outreach Engine
                </div>
                <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 mb-2">Campaigns</h1>
                <p className="text-slate-500 text-sm font-medium">WhatsApp Automation via Multi-Session API</p>
            </div>

            <div className="space-y-6">
                
                {/* Collapsible API Credentials Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <button 
                        onClick={() => setIsApiConfigOpen(!isApiConfigOpen)}
                        className="w-full flex items-center justify-between p-5 bg-white hover:bg-slate-50 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-50 rounded-xl">
                                <Key className="w-5 h-5 text-indigo-500" />
                            </div>
                            <h3 className="font-bold text-sm tracking-wide text-slate-800 uppercase">API Credentials</h3>
                        </div>
                        {isApiConfigOpen ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                    </button>
                    
                    <AnimatePresence>
                        {isApiConfigOpen && (
                            <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="border-t border-slate-100"
                            >
                                <div className="p-5 space-y-4">
                                    <div className="bg-blue-50/50 p-3 rounded-xl flex items-start gap-3 border border-blue-100">
                                        <AlertCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                                        <p className="text-[11px] text-blue-700 leading-relaxed font-semibold">
                                            Your API Key is used to authenticate requests. Ensure your session is "Connected" in the Dashboard before starting.
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="relative">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">WhatsApp API</label>
                                            <div className="relative">
                                                <input 
                                                    type="password" 
                                                    value={apiKey}
                                                    onChange={(e) => setApiKey(e.target.value)}
                                                    placeholder="brk_..." 
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 pr-24 text-xs font-mono focus:ring-2 focus:ring-primary outline-none transition-all"
                                                />
                                                <button 
                                                    onClick={saveConfig}
                                                    disabled={isFetchingSessions}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-bold rounded-lg hover:bg-black transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                                                >
                                                    {isFetchingSessions ? <Loader2 size={12} className="animate-spin" /> : <ShieldCheck size={12} className="text-emerald-400" />}
                                                    SAVE
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Connect Number / Session ID (+91830280XXXX)</label>
                                            {availableSessions.length > 0 ? (
                                                <div className="space-y-2">
                                                    <select 
                                                        value={sessionId}
                                                        onChange={(e) => setSessionId(e.target.value)}
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-primary outline-none transition-all appearance-none cursor-pointer"
                                                    >
                                                        <option value="">Choose your phone...</option>
                                                        {availableSessions.map(s => (
                                                            <option key={s.sessionId} value={s.sessionId}>
                                                                {s.name} ({s.number}) - {s.status.toUpperCase()}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <button 
                                                        onClick={() => setAvailableSessions([])}
                                                        className="text-[9px] font-bold text-slate-400 hover:text-rose-500 transition-all ml-1"
                                                    >
                                                        Manual Entry
                                                    </button>
                                                </div>
                                            ) : (
                                                <input 
                                                    type="text" 
                                                    value={sessionId}
                                                    onChange={(e) => setSessionId(e.target.value)}
                                                    placeholder="+91830280XXXX" 
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-mono focus:ring-2 focus:ring-primary outline-none transition-all"
                                                />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Main Configuration Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 md:p-6 space-y-6">
                    
                    {/* Numbers Section */}
                    <div>
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-3">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Users size={16} className="text-slate-400" /> Recipient Numbers
                            </label>
                            
                            <div className="mt-2 md:mt-0 relative overflow-hidden">
                                <input 
                                    type="file" 
                                    accept=".txt,.csv" 
                                    onChange={handleNumbersUpload}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <button className="flex items-center gap-1.5 text-[10px] font-bold text-primary bg-primary/5 hover:bg-primary/10 py-1.5 px-3 rounded-lg transition-colors">
                                    <Upload size={12} />
                                    Upload CSV/TXT
                                </button>
                            </div>
                        </div>
                        <p className="text-[10px] font-medium text-slate-400 mb-2 ml-1">Files should contain numbers separated by commas or new lines (e.g. 919876543210).</p>
                        <textarea 
                            value={numbersRaw}
                            onChange={(e) => setNumbersRaw(e.target.value)}
                            rows={4}
                            placeholder="919876543210&#10;918877665544"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-mono focus:ring-2 focus:ring-primary outline-none resize-y transition-all"
                        />
                    </div>

                    {/* Message Content Section */}
                    <div>
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-3">
                            <MessageCircle size={16} className="text-slate-400" /> Message Content
                        </label>
                        
                        <div className="relative border border-slate-200 rounded-xl bg-slate-50 transition-all focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent">
                            <textarea 
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows={5}
                                placeholder="Hi there! Check out our new update..."
                                className="w-full bg-transparent p-4 text-sm text-slate-700 leading-relaxed outline-none resize-none"
                            />
                            
                            {/* Toolbar */}
                            <div className="p-3 border-t border-slate-200 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {/* Media Upload */}
                                    <div className="relative">
                                        <input 
                                            type="file" 
                                            accept="image/*,video/*,application/pdf"
                                            onChange={handleMediaUpload}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                        <button className="flex items-center justify-center w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-primary hover:border-primary transition-colors">
                                            <Paperclip size={14} />
                                        </button>
                                    </div>

                                    {/* Emoji Picker */}
                                    <div className="relative" ref={emojiPickerRef}>
                                        <button 
                                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                            className="flex items-center justify-center w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-amber-500 hover:border-amber-500 transition-colors"
                                        >
                                            <Smile size={14} />
                                        </button>
                                        
                                        {showEmojiPicker && (
                                            <div className="absolute z-50 bottom-10 left-0 bg-white shadow-2xl rounded-2xl border border-slate-100 overflow-hidden">
                                                <EmojiPicker 
                                                    onEmojiClick={handleEmojiClick}
                                                    theme={Theme.LIGHT}
                                                    lazyLoadEmojis={true}
                                                    searchDisabled={false}
                                                    width={300}
                                                    height={400}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <span className="text-[10px] font-bold text-slate-400">
                                    {message.length} chars
                                </span>
                            </div>
                        </div>

                        {/* Media Preview Badge */}
                        {mediaFile && (
                            <div className="mt-3 flex items-center gap-3 bg-indigo-50 border border-indigo-100 px-3 py-2 rounded-xl w-max">
                                <Paperclip size={14} className="text-indigo-500" />
                                <span className="text-xs font-bold text-indigo-700 truncate max-w-[200px]">{mediaFile.name}</span>
                                <button onClick={removeMedia} className="p-1 hover:bg-indigo-200 rounded-full text-indigo-500 transition-colors">
                                    <X size={12} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Submit Action */}
                <button 
                    onClick={startCampaign}
                    disabled={status === 'sending' || status === 'success'}
                    className={`w-full py-4 rounded-xl font-black shadow-lg flex items-center justify-center gap-3 transition-all active:scale-[0.98] ${
                        status === 'sending'
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 shadow-none' 
                        : status === 'success'
                        ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                        : 'btn-primary text-white shadow-primary/20 hover:shadow-primary/40'
                    }`}
                >
                    {status === 'sending' ? (
                        <>
                            <Loader2 size={18} className="animate-spin text-primary" />
                            <span className="text-primary">Queuing on Server...</span>
                        </>
                    ) : status === 'success' ? (
                        <>
                            <CheckCircle2 size={18} />
                            Campaign Queued Successfully
                        </>
                    ) : (
                        <>
                            <Send size={18} />
                            Start Global Outreach
                        </>
                    )}
                </button>
                
                {/* Information Notice */}
                <p className="text-center text-[10px] font-medium text-slate-400 mt-4 leading-relaxed max-w-lg mx-auto">
                    Messages are queued natively on the Multi-Session backend. The system automatically inserts secure random delays (between 3 to 12 seconds) and simulates human typing to prevent bans.
                </p>
            </div>

            {/* Sending Progress Slide-up */}
            <AnimatePresence>
                {(status === 'sending' || status === 'success') && (
                    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="relative w-full max-w-lg bg-white rounded-t-[2.5rem] sm:rounded-3xl shadow-2xl p-8 pt-10 text-center"
                        >
                            <div className="w-20 h-20 bg-primary/5 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                {status === 'sending' ? (
                                    <Loader2 size={40} className="text-primary animate-spin" />
                                ) : (
                                    <CheckCircle2 size={40} className="text-emerald-500 animate-bounce" />
                                )}
                            </div>

                            <h2 className="text-2xl font-black text-slate-900 mb-2">
                                {status === 'sending' ? "Outreach in Progress" : "Campaign Launched!"}
                            </h2>
                            <p className="text-slate-500 text-sm mb-8 px-4 leading-relaxed">
                                {status === 'sending' 
                                    ? "We are currently pushing your leads to the anti-ban message queue. Please stay on this page for security sync."
                                    : "All leads have been successfully transmitted. The backend will handle the delivery with jitter delays."}
                            </p>

                            <div className="space-y-3">
                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: status === 'success' ? '100%' : '60%' }}
                                        className="h-full bg-primary"
                                    />
                                </div>
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                    {status === 'sending' ? "Transmitting..." : "Transmission Complete"}
                                </p>
                            </div>

                            {status === 'sending' && (
                                <button 
                                    onClick={() => setShowExitConfirm(true)}
                                    className="mt-8 text-xs font-black text-rose-500 uppercase tracking-widest hover:underline"
                                >
                                    Cancel / Abort Sequence
                                </button>
                            )}
                            
                            {status === 'success' && (
                                <button 
                                    onClick={() => setStatus('idle')}
                                    className="mt-8 w-full py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-xl active:scale-95 transition-all"
                                >
                                    Dismiss Documentation
                                </button>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Exit Confirmation Dialog */}
            <AnimatePresence>
                {showExitConfirm && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 text-center"
                        >
                            <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <AlertCircle size={32} />
                            </div>
                            <h3 className="text-lg font-black text-slate-900 mb-2">Stop Outreach?</h3>
                            <p className="text-slate-500 text-xs mb-6 px-2">
                                Closing this will stop the queue synchronization. Leads already pushed to the server will still be sent, but the rest will be cancelled.
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                                <button 
                                    onClick={() => setShowExitConfirm(false)}
                                    className="py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-200 transition-all"
                                >
                                    Continue
                                </button>
                                <button 
                                    onClick={confirmExit}
                                    className="py-3 bg-rose-500 text-white rounded-xl font-bold text-xs hover:bg-rose-600 shadow-lg shadow-rose-500/20 transition-all"
                                >
                                    Yes, Stop
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            
            <style jsx global>{`
                .btn-primary {
                    background: linear-gradient(135deg, #2563eb, #4f46e5);
                }
            `}</style>
        </div>
    );
}
