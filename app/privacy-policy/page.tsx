
import React from 'react';

export default function PrivacyPolicy() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-3xl">
            <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
            <p className="text-sm text-muted-foreground mb-4">Last Updated: {new Date().toLocaleDateString()}</p>

            <section className="mb-6">
                <h2 className="text-xl font-semibold mb-2">1. Introduction</h2>
                <p className="mb-2">
                    Investment CoPilot ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our application.
                </p>
            </section>

            <section className="mb-6">
                <h2 className="text-xl font-semibold mb-2">2. Information We Collect</h2>
                <p className="mb-2">
                    <strong>Google Account Information:</strong> When you sign in with Google, we access your email address and basic profile information to authenticate you.
                </p>
                <p className="mb-2">
                    <strong>Google Drive and Sheets Data:</strong> We request access to your Google Drive and Google Sheets to:
                </p>
                <ul className="list-disc list-inside ml-4 mb-2">
                    <li>Create and manage a specific spreadsheet ("Investment CoPilot - Portfolio") for your portfolio data.</li>
                    <li>Read and write portfolio data and analysis results to this spreadsheet.</li>
                </ul>
                <p>
                    We do <strong>not</strong> access any other files in your Google Drive.
                </p>
            </section>

            <section className="mb-6">
                <h2 className="text-xl font-semibold mb-2">3. How We Use Your Information</h2>
                <p className="mb-2">
                    We use your information solely to provide the functionality of the Investment CoPilot application, specifically:
                </p>
                <ul className="list-disc list-inside ml-4">
                    <li>Authenticating your user session.</li>
                    <li>Syncing your investment portfolio data to your personal Google Sheet.</li>
                    <li>Generating AI-driven investment insights based on your portfolio data.</li>
                </ul>
            </section>

            <section className="mb-6">
                <h2 className="text-xl font-semibold mb-2">4. Data Sharing and Disclosure</h2>
                <p className="mb-2">
                    We do not sell, trade, or otherwise transfer your personal information to outside parties. Your data remains in your own Google Drive and is only accessed by the application to perform the requested actions.
                </p>
            </section>

            <section className="mb-6">
                <h2 className="text-xl font-semibold mb-2">5. Limited Use Policy</h2>
                <p className="mb-2">
                    Investment CoPilot's use and transfer to any other app of information received from Google APIs will adhere to <a href="https://developers.google.com/terms/api-services-user-data-policy#additional_requirements_for_specific_api_scopes" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Google API Services User Data Policy</a>, including the Limited Use requirements.
                </p>
            </section>

            <section className="mb-6">
                <h2 className="text-xl font-semibold mb-2">6. Contact Us</h2>
                <p>
                    If you have any questions about this Privacy Policy, please contact us at learnwithbotta@gmail.com.
                </p>
            </section>

            <div className="mt-8 pt-6 border-t">
                <a href="/" className="text-blue-600 hover:underline">← Back to Home</a>
            </div>
        </div>
    );
}
