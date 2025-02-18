import React from 'react';
import Link from 'next/link';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-[#00A7A2] mb-8">Privacy Policy</h1>
        <div className="bg-white shadow-md rounded-lg p-6">
          <p className="text-gray-700">
            <strong>Effective Date:</strong> 2025.02.18<br />
            <strong>Last Updated:</strong> 2025.02.18
          </p>
          
          <h2 className="text-lg font-semibold text-[#00A7A2] mt-6">Introduction</h2>
          <p className="text-gray-700">
            Welcome to Edu Eats. Your privacy is important to us, and this Privacy Policy outlines how we collect, use, and protect your personal information when you use our services at https://edueats.com.au. By using our website and services, you agree to the collection and use of your information in accordance with this policy.
          </p>
          
          <h2 className="text-lg font-semibold text-[#00A7A2] mt-6">Information We Collect</h2>
          <ul className="text-gray-700 list-disc list-inside">
            <li><strong>Personal Information:</strong> Name, email address, phone number, delivery address, and payment details.</li>
            <li><strong>Account Information:</strong> Login credentials and order history.</li>
            <li><strong>Payment Information:</strong> We use Stripe to process payments securely.</li>
            <li><strong>Authentication Data:</strong> Azure Microsoft Single Sign-On (SSO) authentication.</li>
            <li><strong>Technical Data:</strong> IP address, browser type, operating system, and usage data.</li>
            <li><strong>Cookies and Tracking Technologies:</strong> Used to enhance experience and analyze traffic.</li>
          </ul>
          
          <h2 className="text-lg font-semibold text-[#00A7A2] mt-6">How We Use Your Information</h2>
          <ul className="text-gray-700 list-disc list-inside">
            <li>Process and fulfill orders.</li>
            <li>Facilitate payments through Stripe.</li>
            <li>Authenticate users through Azure Microsoft SSO.</li>
            <li>Provide customer support.</li>
            <li>Improve and personalize our services.</li>
            <li>Ensure security and prevent fraud.</li>
            <li>Comply with legal obligations.</li>
          </ul>
          
          <h2 className="text-lg font-semibold text-[#00A7A2] mt-6">How We Share Your Information</h2>
          <ul className="text-gray-700 list-disc list-inside">
            <li><strong>Payment Processors:</strong> Stripe processes all transactions securely.</li>
            <li><strong>Authentication Providers:</strong> Azure Microsoft SSO is used for secure login authentication.</li>
            <li><strong>Service Providers:</strong> Assist in website operations, delivery services, and customer support.</li>
            <li><strong>Legal Authorities:</strong> If required by law or to protect our rights and security.</li>
          </ul>
          
          <h2 className="text-lg font-semibold text-[#00A7A2] mt-6">Stripe and Payment Security</h2>
          <p className="text-gray-700">
            We use Stripe as our payment processor, which complies with PCI DSS standards to ensure secure transactions. Stripe also handles identity verification (KYC compliance). Your payment and KYC details are never stored on our servers.
          </p>
          
          <h2 className="text-lg font-semibold text-[#00A7A2] mt-6">Azure Microsoft SSO Security</h2>
          <p className="text-gray-700">
            We use Azure Microsoft Single Sign-On (SSO) to provide secure authentication. User passwords are not stored directly by us. Refer to Microsoft’s Privacy Statement for details.
          </p>
          
          <h2 className="text-lg font-semibold text-[#00A7A2] mt-6">Data Retention</h2>
          <p className="text-gray-700">
            We retain your personal data as long as necessary to provide services, comply with legal obligations, resolve disputes, and enforce agreements.
          </p>
          
          <h2 className="text-lg font-semibold text-[#00A7A2] mt-6">Your Rights and Choices</h2>
          <ul className="text-gray-700 list-disc list-inside">
            <li>Access, update, or delete your personal data.</li>
            <li>Withdraw consent for marketing communications.</li>
            <li>Restrict or object to data processing.</li>
            <li>Lodge a complaint with a data protection authority.</li>
          </ul>
          
          <h2 className="text-lg font-semibold text-[#00A7A2] mt-6">Cookies and Tracking</h2>
          <p className="text-gray-700">
            We use cookies to enhance user experience and analyze website traffic. You can manage cookie preferences in your browser settings.
          </p>
          
          <h2 className="text-lg font-semibold text-[#00A7A2] mt-6">Third-Party Links</h2>
          <p className="text-gray-700">
            Our website may contain links to third-party websites. We are not responsible for their privacy practices.
          </p>
          
          <h2 className="text-lg font-semibold text-[#00A7A2] mt-6">Legal and Export Restrictions</h2>
          <p className="text-gray-700">
            Edu Eats operates in compliance with applicable laws and regulations, including export control and trade compliance laws. Users may not use our services if they are:
          </p>
          <p className="text-gray-700">
            By using Edu Eats, you confirm that you comply with all applicable local and international regulations. We reserve the right to suspend or terminate accounts that violate these legal requirements.
          </p>
          
          <h2 className="text-lg font-semibold text-[#00A7A2] mt-6">Changes to This Privacy Policy</h2>
          <p className="text-gray-700">
            We may update this policy periodically. Users will be notified of significant changes via our website or email.
          </p>
          
          <h2 className="text-lg font-semibold text-[#00A7A2] mt-6">Contact Us</h2>
          <p className="text-gray-700">
            If you have any questions, please contact us at:
            <br />Email: <a href="mailto:support@edueats.com.au" className="text-blue-600 underline">support@edueats.com.au</a></p>
          <Link href="/" className="mt-4 inline-block bg-[#00A7A2] text-white py-2 px-4 rounded hover:bg-[#008C87] transition duration-300">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;