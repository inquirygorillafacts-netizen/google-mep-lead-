"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, BookOpen, Target, Zap, Globe2, Layers, Heart, TrendingUp, ShieldCheck, CheckCircle2, ChevronRight, Search, Layout, Database, ShoppingBag, Terminal, Sliders, Smartphone, Palette, Briefcase, Users, Scale, Hammer, Rocket, Coffee, Sun, Trash2, X, Scissors, Package, Truck, Gift, GraduationCap, Stethoscope, Map, HeartHandshake } from "lucide-react";
import clsx from "clsx";
import { useRouter } from "next/navigation";

// --- CONTENT DEFINITIONS ---

interface UseCase {
  id: number;
  icon: any;
  title: string;
  target: string;
  explanation: string;
  example: string;
}

const englishContent: UseCase[] = [
  { id: 1, icon: Layout, title: "Web Design Agencies", target: "Businesses with 'No Website'", explanation: "Identify businesses that have a Google presence but no website. These are prime targets for web development services.", example: "Find a 'Spa in Jaipur' with 50+ reviews but no website. Offer them a professional booking site." },
  { id: 2, icon: Terminal, title: "SaaS & Billing Software", target: "Retail & Restaurants", explanation: "Target high-traffic businesses needing automated billing or POS systems.", example: "Scrape 'Dhabas' or 'Cafes' in a district to sell your billing software." },
  { id: 3, icon: Database, title: "Local Lead Brokers", target: "Data Buyers / Niche Firms", explanation: "Collect and package high-quality, verified data for specific industries to sell as lead lists.", example: "Package a list of 200 'Real Estate Agents' with verified phone numbers for a mortgage firm." },
  { id: 4, icon: TrendingUp, title: "SEO & GMB Experts", target: "Low-Rated Businesses", explanation: "Find businesses with ratings under 4.0 or fewer than 20 reviews and offer GMB optimization services.", example: "Target 'Hardware Stores' with 3.2 stars and offer review management and SEO services." },
  { id: 5, icon: Smartphone, title: "App Developers", target: "Ecommerce & Chain Stores", explanation: "Pitch mobile app transformation to businesses that only have a basic web presence.", example: "Locate 'Local Grocery Chains' and pitch a custom delivery app." },
  { id: 6, icon: Palette, title: "Logo & Branding Studios", target: "Newly Opened / Basic Setups", explanation: "Find businesses with generic names or incomplete profiles to offer professional branding.", example: "Target 'Consultancies' or 'Startups' in a hub that need a premium brand identity." },
  { id: 7, icon: ShieldCheck, title: "CCTV & Security Systems", target: "High-Value Retailers", explanation: "Target new jewelry shops, showrooms, or pharmacies that need high-end security setups.", example: "Filter 'New Showrooms' in an upscale area for your security system services." },
  { id: 8, icon: Sun, title: "Solar Energy Solutions", target: "Industrial & Warehousing", explanation: "Find businesses with large rooftop spaces like factories or warehouses for solar audits.", example: "Target 'Factories' or 'Hospitals' for commercial solar panel installations." },
  { id: 9, icon: Scale, title: "CA & Tax Consultants", target: "New Business Registrations", explanation: "Locate newly listed service providers who likely need help with GST, tax, and compliance.", example: "Search for 'Accounting Firms' or 'New Retailers' to offer legal and tax filing services." },
  { id: 10, icon: Users, title: "HR & Recruitment Firms", target: "Expanding Teams", explanation: "Identify growing companies or service hubs to offer staffing and recruitment solutions.", example: "Target 'Logistics Centers' or 'Call Centers' that frequently hire at scale." },
  { id: 11, icon: Hammer, title: "Interior Designers", target: "New Office Spaces", explanation: "Find commercial spaces, clinics, or showrooms that have recently opened and need interior work.", example: "Search for 'New Multi-speciality Clinics' to offer high-end medical interior design." },
  { id: 12, icon: Heart, title: "Cleaning & Pest Control", target: "B2B AMC Contracts", explanation: "Target hotels, schools, or hospitals for recurring maintenance and hygiene contracts.", example: "Secure an AMC (Annual Maintenance Contract) with 'Private Schools' in your city." },
  { id: 13, icon: Briefcase, title: "Legal Consultancies", target: "Corporate Compliance", explanation: "Find tech startups or e-commerce firms needing trademark, patent, or contract services.", example: "Help 'Tech Startups' in a district with IP protection and legal paperwork." },
  { id: 14, icon: Coffee, title: "Events & Catering", target: "Hospitality Partnerships", explanation: "Connect with hotels or corporate office managers for partnership in event management.", example: "Pitch your catering services to 'Corporate Office Parks' for their daily cafeterias." },
  { id: 15, icon: Zap, title: "Digital Business Cards", target: "Small Scale Vendors", explanation: "Sell affordable digital visiting cards to small shop owners who want to look professional.", example: "Sell NFC digital cards to 'Local Boutique' owners who share contacts frequently." },
  { id: 16, icon: Globe2, title: "Content & PR Agencies", target: "Reputation Management", explanation: "Find high-revenue salons or clinics that need a PR boost or positive press and articles.", example: "Offer 'Top Dental Clinics' a features article in a local business magazine." },
  { id: 17, icon: Sliders, title: "Franchise Consulting", target: "Successful Local Brands", explanation: "Identify successful local cafes or restaurants and help them model for franchising.", example: "Approach a 'Famous Local Sweet Shop' to help them scale into a national franchise." },
  { id: 18, icon: Smartphone, title: "WhatsApp Marketing", target: "Retail Customer Retention", explanation: "Help local shops set up WhatsApp automation to keep their customers coming back.", example: "Set up a loyalty broadcast for a 'Popular Supermarket' in your locality." },
  { id: 19, icon: Rocket, title: "Growth Marketing", target: "High-Ticket Service Units", explanation: "Find premium services like 'Car Detailers' or 'Luxury Salons' and offer lead ads management.", example: "Manage Facebook/Instagram ads for 'Luxury Car Spa' owners to get high-paying clients." },
  { id: 20, icon: CheckCircle2, title: "Software Testing (QA)", target: "Platform Stability", explanation: "Find businesses with buggy websites or poor UI and offer quality assurance services.", example: "Find 'Fintech Startups' with slow portals and offer technical site auditing." },
  { id: 21, icon: Globe, title: "Web Design Partnerships", target: "Other Design Agencies", explanation: "Find design agencies in your area to offer white-label services or professional collaboration.", example: "Search 'Web Design Agencies in Mumbai' and call them to partner on larger projects." },
  { id: 22, icon: Scissors, title: "Apparel & Clothing Sourcing", target: "Clothing Manufacturers", explanation: "Extract high-quality leads of local manufacturers for your upcoming fashion brand.", example: "Search 'Clothing Manufacturers in Ahmedabad' to find your next textile partner." },
  { id: 23, icon: Coffee, title: "Premium Cafe Hunting", target: "High-Rated Local Spots", explanation: "Use rating filters to find the absolute best food gems for your upcoming project or visit.", example: "Search 'Cafes in Pune' with a 4.5+ star filter to discover the most premium coffee shops." },
  { id: 24, icon: Package, title: "Printing & Packaging", target: "New Retail Outlets", explanation: "Every new physical store needs bags and boxes. Target them before they find a vendor.", example: "Target 'New Jewelry Shops' for bulk velvet pouches and branded bag orders." },
  { id: 25, icon: Truck, title: "Logistics & Delivery", target: "D2C Brands / Florists", explanation: "Find businesses that could benefit from faster, tech-enabled last-mile delivery services.", example: "Partner with 'Wholesale Florists' to offer fast morning delivery as a logistics provider." },
  { id: 26, icon: Gift, title: "Corporate Gifting Support", target: "Office Managers / MNCs", explanation: "Extract office managers' contacts to pitch seasonal corporate gift hampers during festive runs.", example: "Target 'Software Hubs' in Gurgaon during Diwali for high-volume gift orders." },
  { id: 27, icon: GraduationCap, title: "Skill Dev & Coaching", target: "Schools & Colleges", explanation: "Find educational institutions to offer guest lectures, skill training, or joint workshops.", example: "Pitch an 'AI Coding Bootcamp' to 'Private High Schools' within your district." },
  { id: 28, icon: Stethoscope, title: "Medical Representation", target: "Doctors / Private Clinics", explanation: "Map out every private practitioner in a 10km radius for sales calls and equipment samples.", example: "Scan 'Orthopedic Surgeons' to introduce new medical equipment or samples directly." },
  { id: 29, icon: Map, title: "Travel & Resort Partners", target: "Travel Agents", explanation: "Find independent travel agents in a specific area to partner for curated tour packages.", example: "Partner with 'Travel Agents' in a city market to sell your specialized resort memberships." },
  { id: 30, icon: HeartHandshake, title: "NGO & CSR Partnerships", target: "Industrial Units / Trusts", explanation: "Find large corporations for funding or partnership in major social development projects.", example: "Reach out to 'Manufacturing Units' for CSR sponsorship of your local education charity." },
];

const hindiContent: UseCase[] = [
  { id: 1, icon: Layout, title: "Web Design Agencies", target: "बिज़नेस जिनकी वेबसाइट नहीं है", explanation: "उन व्यवसायों को पहचानें जिनकी गूगल पर उपस्थिति तो है पर अपनी कोई वेबसाइट नहीं है। वे वेब डेवलपमेंट सेवाओं के लिए बेहतरीन क्लाइंट्स हो सकते हैं।", example: "जयपुर में ऐसी 'Spa' खोजें जिसकी 50+ रेटिंग हो पर वेबसाइट न हो। उन्हें एक एडवांस बुकिंग पोर्टल पिच करें।" },
  { id: 2, icon: Terminal, title: "SaaS & Billing Software", target: "रिटेल और रेस्टोरेंट्स", explanation: "ऐसे व्यस्त व्यवसायों को लक्षित करें जिन्हें ऑटोमेटेड बिलिंग या POS सिस्टम की सख्त ज़रूरत है।", example: "अपने शहर के 'ढाबों' या 'कैफे' का डेटा निकालें और उन्हें अपना बिलिंग सॉफ्टवेयर बेचें।" },
  { id: 3, icon: Database, title: "Local Lead Brokers", target: "डेटा खरीदार / विशिष्ट फर्म", explanation: "विशिष्ट उद्योगों के लिए उच्च गुणवत्ता वाला, सत्यापित डेटा इकट्ठा करें और उसे लीड लिस्ट के रूप में बेचें।", example: "एक होम लोन फर्म के लिए 200 सत्यापित 'रियल एस्टेट एजेंटों' की सूची तैयार करें।" },
  { id: 4, icon: TrendingUp, title: "SEO & GMB एक्सपर्ट्स", target: "कम रेटिंग वाले बिज़नेस", explanation: "ऐसी कंपनियों को खोजें जिनकी रेटिंग 4.0 से कम है और उन्हें रिव्यु मैनेजमेंट और GMB रैंकिंग सेवाएँ दें।", example: "ऐसी 'हार्डवेयर दुकानों' को टारगेट करें जिनके 3.2 स्टार्स हैं और उन्हें SEO सर्विस ऑफर करें।" },
  { id: 5, icon: Smartphone, title: "एप डेवलपर्स", target: "ई-कॉमर्स और रिटेल चैन", explanation: "उन व्यवसायों को मोबाइल एप में बदलने का सुझाव दें जिनकी अभी केवल एक पुरानी वेबसाइट है।", example: "स्थानीय 'ग्रॉसरी चैन' खोजें और उनके लिए एक कस्टम डिलीवरी एप का प्रस्ताव दें।" },
  { id: 6, icon: Palette, title: "ब्रांडिंग और लोगो स्टूडियो", target: "नए खुले बिज़नेस", explanation: "नए शुरू हुए बिज़नेस या अधूरी प्रोफाइल वाले व्यवसायों को अपनी ब्रांडिंग सेवाएँ प्रदान करें।", example: "किसी बिज़नेस हब में 'कंसल्टेंसी' फर्म को उसकी प्रीमियम ब्रांड पहचान बनाने में मदद करें।" },
  { id: 7, icon: ShieldCheck, title: "CCTV & सिक्योरिटी सिस्टम", target: "कीमती सामान के शोरूम", explanation: "आभूषण (Jewelry), शोरूम और फार्मेसी को टारगेट करें जिन्हें हाई-एंड सिक्योरिटी की सख्त आवश्यकता है।", example: "पॉश इलाकों में 'नए शोरूम' को अपने हाई-टेक सिक्योरिटी सिस्टम के लिए फ़िल्टर करें।" },
  { id: 8, icon: Sun, title: "सोलर एनर्जी सॉल्यूशन", target: "इंडस्ट्रियल और वेयरहाउस", explanation: "फैक्ट्री और गोदामों जैसी बड़ी छतों वाले व्यवसायों को सोलर ऑडिट और इंस्टालेशन के लिए खोजें।", example: "बड़ी 'फैक्ट्री' या 'हॉस्पिटल' को कमर्शियल सोलर इंस्टालेशन के लिए टारगेट करें।" },
  { id: 9, icon: Scale, title: "CA और टैक्स सलाहकार", target: "नया बिज़नेस रजिस्ट्रेशन", explanation: "नए लिस्टेड सर्विस प्रोवाइडर्स को खोजें जिन्हें GST, टैक्स और कंप्लायंस में मदद की ज़रूरत है।", example: "कानूनी और टैक्स फाइलिंग सेवाओं के लिए 'नए रिटेलर्स' को अपना प्रस्ताव भेजें।" },
  { id: 10, icon: Users, title: "HR और भर्ती फर्म", target: "बढ़ती हुई टीमें", explanation: "उन बढ़ती फर्मों को पहचानें जिन्हें वर्कफोर्स और भर्ती के लिए सॉल्यूशंस की ज़रूरत है।", example: "बड़े 'लॉजिस्टिक्स सेंटर' खोजें जिन्हें लगातार बड़े पैमाने पर स्टाफ की ज़रूरत होती है।" },
  { id: 11, icon: Hammer, title: "इंटीरियर डिजाइनर्स", target: "नए ऑफिस स्पेस", explanation: "कमर्शियल स्पेस, क्लीनिक या शोरूम खोजें जो हाल ही में खुले हैं और जिन्हें इंटीरियर डेकोरेशन की ज़रूरत है।", example: "लक्जरी इंटीरियर के लिए 'नए मल्टी-स्पेशियलिटी क्लीनिक' के मालिक को अप्रोच करें।" },
  { id: 12, icon: Heart, title: "क्लीनिंग और पेस्ट कंट्रोल", target: "B2B AMC कांट्रैक्ट", explanation: "होटल, स्कूल या अस्पतालों को उनके रखरखाव और स्वच्छता के वार्षिक अनुबंध के लिए टारगेट करें।", example: "अपने शहर के 'प्राइवेट स्कूलों' के साथ स्वच्छता का एनुअल कांट्रैक्ट फिक्स करें।" },
  { id: 13, icon: Briefcase, title: "कानूनी कंसल्टेंसी", target: "कॉर्पोरेट कंप्लायंस", explanation: "टेक स्टार्टअप्स को ट्रेडमार्क, पेटेंट या एग्रीमेंट्स के कानूनी काम में मदद ऑफर करें।", example: "अपने जिले के 'टेक स्टार्टअप्स' को ट्रेडमार्क और कानूनी दस्तावेजीकरण में मदद करें।" },
  { id: 14, icon: Coffee, title: "इवेंट और कैटरिंग", target: "हॉस्पिटैलिटी पार्टनरशिप", explanation: "होटल और कॉर्पोरेट ऑफिस मैनेजरों के साथ इवेंट मैनेजमेंट में पार्टनरशिप के लिए संपर्क करें।", example: "अपनी कैटरिंग सर्विस को बड़े 'ऑफिस पार्कों' की कैंटीन के लिए पिच करें।" },
  { id: 15, icon: Zap, title: "डिजिटल बिज़नेस कार्ड", target: "छोटे दुकानदार", explanation: "छोटे दुकानदारों को किफायती डिजिटल विजिटिंग कार्ड बेचें जो प्रोफेशनल दिखना चाहते हैं।", example: "स्थानीय 'बुटीक' मालिकों को NFC डिजिटल कार्ड बेचें जो संपर्क जल्दी शेयर करना चाहते हैं।" },
  { id: 16, icon: Globe2, title: "कंटेंट और PR एजेंसियां", target: "रेपुटेशन मैनेजमेंट", explanation: "बड़े क्लीनिक या शोरूम खोजें जिन्हें अपनी साख बढ़ाने के लिए प्रेस और आर्टिकल्स की ज़रूरत है।", example: "शहर के 'टॉप डेंटिस्ट' को लोकल न्यूज़ मैगज़ीन में फीचर करने का प्रस्ताव दें।" },
  { id: 17, icon: Sliders, title: "फ्रेंचाइजी कंसल्टिंग", target: "सफल लोकल ब्रांड्स", explanation: "सफल मिठाई की दुकानों या कैफे को अपनी बिज़नेस स्केलिंग और फ्रेंचाइजी मॉडल में मदद करें।", example: "एक 'मशहूर लोकल मिठाई की दुकान' को नेशनल फ्रेंचाइजी बनाने के लिए अप्रोच करें।" },
  { id: 18, icon: Smartphone, title: "व्हाट्सएप मार्केटिंग", target: "कस्टमर रिटेंशन", explanation: "स्थानीय दुकानों को व्हाट्सएप ऑटोमेशन सेट करने में मदद करें ताकि उनके ग्राहक बार-बार आएं।", example: "अपने पास के 'सुपरमार्केट' के लिए लॉयल्टी ब्रॉडकास्ट सिस्टम सेट करें।" },
  { id: 19, icon: Rocket, title: "ग्रोथ मार्केटिंग", target: "हाई-टिकट सर्विस यूनिट्स", explanation: "लक्जरी सर्विस जैसे 'कार डिटेलर्स' या 'सैलून' के लिए फेसबुक/इंस्टा विज्ञापन सर्विस दें।", example: "अमीर ग्राहकों को लाने के लिए 'लक्जरी कार स्पा' के फेसबुक विज्ञापन मैनेज करें।" },
  { id: 20, icon: CheckCircle2, title: "सॉफ्टवेयर टेस्टिंग (QA)", target: "स्थिरता और सुरक्षा", explanation: "ऐसी वेबसाइट्स खोजें जिनका UI खराब है या स्लो है, और उन्हें टेस्टिंग सर्विस ऑफर करें।", example: "धीमी वेबसाइट वाले 'फिनटेक स्टार्टअप्स' को टेक्निकल ऑडिट सर्विस पिच करें।" },
  { id: 21, icon: Globe, title: "वेब डिज़ाइन पार्टनरशिप", target: "अन्य वेब डिज़ाइन एजेंसियां", explanation: "अपने शहर की अन्य वेब डिज़ाइन एजेंसियों को खोजें और उनके साथ 'व्हाइट-लेबल' काम या पार्टनरशिप करें।", example: "'Web Design Agencies in Mumbai' सर्च करें और उनके साथ बड़े प्रोजेक्ट्स साझा करने के लिए कॉल करें।" },
  { id: 22, icon: Scissors, title: "कपड़ों की मैन्युफैक्चरिंग", target: "गारमेंट मैन्युफैक्चरर्स", explanation: "अपने फैशन ब्रांड के लिए स्थानीय निर्माताओं को फ़िल्टर करें ताकि आपको बेहतरीन रेट्स और वेंडर मिल सकें।", example: "'Clothing Manufacturers in Ahmedabad' खोजें और सीधे अपने नए ब्रांड के लिए वेंडर तय करें।" },
  { id: 23, icon: Coffee, title: "प्रीमियम कैफे हंटिंग", target: "हाई-रेटेड लोकल कैफे", explanation: "रेटिंग और रिव्यु फ़िल्टर का इस्तेमाल करके शहर के सबसे बेहतरीन कॉफ़ी हब्स और हिडन जेम्स खोजें।", example: "'Cafes in Pune' को 4.5+ स्टार्स रेटिंग के साथ खोजें और शहर का सबसे बेहतरीन फूड अनुभव पाएं।" },
  { id: 24, icon: Package, title: "प्रिंटिंग और पैकेजिंग", target: "नए खुले रिटेल आउटलेट्स", explanation: "हर नए बिज़नेस को बैग्स और बॉक्स की ज़रूरत होती है। उन्हें तभी टारगेट करें जब वे वेंडर ढूंढ रहे हों।", example: "'New Jewelry Shops' को उनके प्रीमियम मखमली पाउच और बैग्स की बल्क प्रिंटिंग के लिए टारगेट करें।" },
  { id: 25, icon: Truck, title: "लॉजिस्टिक्स और डिलीवरी", target: "D2C ब्रांड्स / फूल विक्रेता", explanation: "उन स्थानीय बिज़नेसेस को ढूंढें जिन्हें तेज़ डिलीवरी सर्विस की ज़रूरत है और उनके डिलीवरी पार्टनर बनें।", example: "'थोक फूल विक्रेताओं' के साथ पार्टनरशिप करें ताकि आप सुबह-सुबह जल्दी डिलीवरी पहुँचा सकें।" },
  { id: 26, icon: Gift, title: "कॉर्पोरेट गिफ्टिंग", target: "ऑफिस मैनेजर्स / MNC हब्स", explanation: "ऑफिस मैनेजर्स का डेटा निकालें और उन्हें त्योहारों के समय बल्क गिफ्ट हैंम्पर्स पिच करें।", example: "दिवाली के समय 'Gurgaon के सॉफ्टवेयर हब्स' को हाई-वॉल्यूम कॉर्पोरेट गिफ्ट्स के लिए संपर्क करें।" },
  { id: 27, icon: GraduationCap, title: "स्किल ट्रेनिंग और कोचिंग", target: "प्राइवेट स्कूल और कॉलेज", explanation: "स्कूलों और कॉलेजों को स्किल्स ट्रेनिंग, वर्कशॉप्स या गेस्ट लेक्चर्स के लिए खोजें।", example: "शहर के 'प्राइवेट हाई स्कूलों' को उनके विद्यार्थियों के लिए 'AI कोडिंग वर्कशॉप' पिच करें।" },
  { id: 28, icon: Stethoscope, title: "मेडिकल रिप्रेजेंटेटिव", target: "डॉक्टर्स और प्राइवेट क्लीनिक", explanation: "10km के दायरे में हर प्राइवेट डॉक्टर का पता लगाएं ताकि सैंपल्स और उपकरण दिखाना आसान हो।", example: "'Orthopedic Surgeons' खोजें और उन्हें नए मेडिकल डिवाइस या सैंपल्स दिखाने के लिए संपर्क करें।" },
  { id: 29, icon: Map, title: "ट्रेवल और रिसॉर्ट पार्टनर्स", target: "इंडिपेंडेंट ट्रेवल एजेंट्स", explanation: "एक खास क्षेत्र के ट्रेवल एजेंट्स को ढूंढें और उनके साथ होटल बुकिंग का नेटवर्क बनाएं।", example: "मार्केट के 'Travel Agents' के साथ मिलकर उन्हें अपने रिसॉर्ट की मेंबरशिप बेचने के लिए अप्रोच करें।" },
  { id: 30, icon: HeartHandshake, title: "NGO और CSR प्रोजेक्ट्स", target: "इंडस्ट्रियल यूनिट्स", explanation: "सोशल प्रोजेक्ट्स के लिए बड़ी कंपनियों को फंड या पार्टनरशिप (CSR) के लिए खोजें।", example: "क्षेत्र की 'मैन्युफैक्चरिंग यूनिट्स' से अपनी लोक-कल्याण संस्था के लिए स्पॉन्सरशिप मांगें।" },
];

export default function GuidePage() {
  const [lang, setLang] = useState<"en" | "hi" | null>(null);
  const router = useRouter();

  const activeContent = lang === "hi" ? hindiContent : englishContent;

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      {/* Background Decor */}
      <div className="fixed top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10" />
      <div className="fixed bottom-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl -z-10" />

      {/* Language Selection Modal */}
      <AnimatePresence>
        {!lang && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-[3rem] p-10 max-w-lg w-full text-center shadow-2xl border border-white/20"
            >
              <div className="w-20 h-20 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mx-auto mb-8">
                <Globe size={40} />
              </div>
              <h2 className="text-3xl font-black text-slate-900 mb-4 px-4 leading-tight">
                Select Your Language / <br/> भाषा चुनें
              </h2>
              <p className="text-slate-500 text-sm font-medium mb-10 px-6">
                Choose the language you prefer for the business guide. <br/>
                बिज़नेस गाइड के लिए अपनी पसंदीदा भाषा चुनें।
              </p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setLang("hi")}
                  className="py-5 bg-primary text-white rounded-2xl font-black text-lg shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                >
                  हिन्दी
                </button>
                <button
                  onClick={() => setLang("en")}
                  className="py-5 bg-slate-900 text-white rounded-2xl font-black text-lg shadow-xl shadow-slate-900/20 hover:scale-105 active:scale-95 transition-all"
                >
                  English
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className={clsx("max-w-6xl mx-auto px-6 pt-12 pb-24 transition-opacity", !lang && "opacity-0")}>
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 px-2">
          <motion.div initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
            <button 
              onClick={() => router.back()}
              className="group flex items-center gap-2 mb-6 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] hover:text-primary transition-colors"
            >
              <X size={14} className="group-hover:rotate-90 transition-transform" />
              {lang === "hi" ? "पीछे जाएं" : "Back to Profile"}
            </button>
            <div className="flex items-center gap-2 mb-2">
              <span className="p-1 px-2.5 bg-primary/10 text-primary rounded-md text-[9px] font-black uppercase tracking-widest">
                Monetization Handbook v2.0
              </span>
              <button 
                onClick={() => setLang(lang === "hi" ? "en" : "hi")}
                className="p-1 px-2.5 bg-slate-100 text-slate-500 rounded-md text-[9px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
              >
                {lang === "hi" ? "Switch to English" : "हिन्दी में पढ़ें"}
              </button>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 mb-2">
              {lang === "hi" ? "बिज़नेस के" : "Master"}{" "}
              <span className="text-primary">{lang === "hi" ? "30 जादुई तरीके" : "30 Use Cases"}</span>
            </h1>
            <p className="text-slate-500 font-bold text-sm max-w-xl leading-relaxed">
              {lang === "hi" 
                ? "लीड निकालना सिर्फ एक टूल है, लेकिन उस लीड से पैसा कमाना एक कला है। यहाँ वो 30 तरीके हैं जिनसे आप आज ही अपना धंधा बढ़ा सकते हैं।" 
                : "Downloading leads is a tool, but turning them into profit is an art. Here are 30 verified ways to skyrocket your business today."}
            </p>
          </motion.div>

          <div className="h-20 w-20 md:h-32 md:w-32 bg-primary/5 rounded-[2rem] border-4 border-white shadow-2xl flex items-center justify-center -rotate-6">
            <BookOpen size={48} className="text-primary opacity-20" />
          </div>
        </div>

        {/* Use Cases Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
          {activeContent.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
              className="premium-card p-8 group hover:border-primary/30 transition-all flex flex-col h-full overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-[4rem] group-hover:bg-primary/10 transition-colors pointer-events-none" />
              
              <div className="flex items-start gap-5 mb-8">
                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center shrink-0 border border-slate-100 group-hover:bg-primary group-hover:text-white group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-sm">
                  <item.icon size={28} />
                </div>
                <div>
                  <div className="text-primary font-black text-[10px] uppercase tracking-widest mb-1">
                    Strategy #{item.id}
                  </div>
                  <h3 className="text-xl font-black text-slate-900 group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                </div>
              </div>

              <div className="space-y-6 flex-1">
                <div>
                  <h4 className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">
                    <Target size={12} className="text-primary" />
                    {lang === "hi" ? "किसे टारगेट करें?" : "Target Audience"}
                  </h4>
                  <p className="text-sm font-bold text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {item.target}
                  </p>
                </div>

                <div>
                  <h4 className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">
                    <Search size={12} className="text-primary" />
                    {lang === "hi" ? "यह कैसे काम करता है?" : "Operational Strategy"}
                  </h4>
                  <p className="text-sm font-medium text-slate-500 leading-relaxed px-1">
                    {item.explanation}
                  </p>
                </div>

                <div className="pt-4 mt-auto">
                  <div className="p-4 bg-primary/5 rounded-2xl border-l-4 border-primary italic">
                    <p className="text-[10px] font-black uppercase text-primary tracking-widest mb-1.5">
                      {lang === "hi" ? "प्रैक्टिकल उदाहरण" : "Real-World Example"}
                    </p>
                    <p className="text-xs font-bold text-slate-700 leading-relaxed">
                      "{item.example}"
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Mindset Footer */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-24 p-10 md:p-16 bg-slate-900 rounded-[3rem] text-center relative overflow-hidden shadow-2xl"
        >
          {/* Subtle Decor */}
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="grid grid-cols-12 gap-1 h-full">
               {Array.from({length: 120}).map((_, i) => (
                 <div key={i} className="border border-white/5 h-12" />
               ))}
            </div>
          </div>

          <div className="relative z-10">
            <div className="w-16 h-16 bg-white/10 text-white rounded-full flex items-center justify-center mx-auto mb-8 border border-white/20">
              <Rocket size={32} />
            </div>
            
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter mb-8 max-w-3xl mx-auto leading-tight italic">
              {lang === "hi" 
                ? "अब यह आप पर निर्भर है कि आप इस इंजन को कहाँ और कैसे इस्तेमाल करते हैं। आपका माइंडसेट ही आपके मुनाफे की हद तय करेगा।"
                : "The only limit is your imagination. How you wield this engine depends entirely on your mindset. Your growth potential is now absolute."}
            </h2>

            <div className="h-px w-24 bg-primary/30 mx-auto mb-8" />

            <div className="space-y-4">
              <p className="text-slate-400 font-bold uppercase tracking-[0.4em] text-xs">
                {lang === "hi" ? "अभी रुकना मत, मंज़िल आपकी है।" : "NEVER STOP. THE WORLD IS WAITING FOR YOU."}
              </p>
              
              <button 
                onClick={() => router.push("/")}
                className="mt-6 px-10 py-5 bg-primary text-white rounded-2xl font-black uppercase tracking-widest shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all text-sm inline-flex items-center gap-3"
              >
                {lang === "hi" ? "इंजन चालू करें" : "Engage Core Engine"}
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
}
