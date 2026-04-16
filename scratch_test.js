const privateKey = process.env.FIREBASE_PRIVATE_KEY;
console.log("Raw Key Length:", privateKey?.length);
const formatted = privateKey?.replace(/\\n/g, '\n').replace(/"/g, '');
console.log("Formatted Key Length:", formatted?.length);
console.log("Starts with BEGIN:", formatted?.startsWith("-----BEGIN PRIVATE KEY-----"));
console.log("Ends with END:", formatted?.trim().endsWith("-----END PRIVATE KEY-----"));
if (formatted) {
    const lines = formatted.split('\n');
    console.log("Number of lines:", lines.length);
}
