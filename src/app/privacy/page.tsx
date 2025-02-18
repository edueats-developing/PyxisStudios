'use client'

export default function Privacy() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 text-center">Privacy Policy</h1>
      <h2 className="text-xl mb-4 text-center">Effective Date: 2025.02.18</h2>
      <h2 className="text-xl mb-8 text-center">Last Updated: 2025.02.18</h2>

      <div className="space-y-6">
        <section>
          <p className="text-lg leading-relaxed">
            Welcome to Edu Eats. Your privacy is important to us, and this Privacy Policy outlines how we collect, use, and protect your personal information when you use our services at <a href="https://edueats.com.au" className="text-blue-600 underline">https://edueats.com.au</a>. By using our website and services, you agree to the collection and use of your information in accordance with this policy.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-2">Information We Collect</h2>
          <p className="text-lg">We collect the following types of personal information when you use our platform:</p>
          <ul className="list-disc list-inside text-lg mt-2">
            <li><strong>Personal Information:</strong> Name, email address, phone number, delivery address, and payment details.</li>
            <li><strong>Account Information:</strong> Login credentials and order history.</li>
            <li><strong>Payment Information:</strong> Processed securely through Stripe. See Stripe’s Privacy Policy for details.</li>
            <li><strong>Authentication Data:</strong> Azure Microsoft Single Sign-On (SSO) authentication details.</li>
            <li><strong>Technical Data:</strong> IP address, browser type, operating system, and usage data.</li>
            <li><strong>Cookies and Tracking Technologies:</strong> Used to enhance user experience and analyze website traffic.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-2">How We Use Your Information</h2>
          <ul className="list-disc list-inside text-lg">
            <li>Process and fulfill orders.</li>
            <li>Facilitate payments through Stripe.</li>
            <li>Authenticate users via Azure Microsoft SSO.</li>
            <li>Provide customer support.</li>
            <li>Improve and personalize our services.</li>
            <li>Ensure security and prevent fraud.</li>
            <li>Comply with legal obligations.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-2">How We Share Your Information</h2>
          <p className="text-lg">We do not sell or rent your personal information. However, we may share your data with:</p>
          <ul className="list-disc list-inside text-lg">
            <li><strong>Payment Processors:</strong> Stripe for secure transactions.</li>
            <li><strong>Authentication Providers:</strong> Azure Microsoft SSO for login authentication.</li>
            <li><strong>Service Providers:</strong> Assisting in website operations, delivery, and customer support.</li>
            <li><strong>Legal Authorities:</strong> If required by law or to protect our rights and security.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-2">Security and Data Protection</h2>
          <p className="text-lg">
            We use industry-standard security measures, including Stripe’s PCI DSS compliance for payments and Microsoft Azure SSO for authentication security. Your payment and authentication details are never stored on our servers.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-2">Data Retention</h2>
          <p className="text-lg">We retain your personal data as long as necessary to provide our services, comply with legal obligations, resolve disputes, and enforce agreements.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-2">Your Rights and Choices</h2>
          <p className="text-lg">Depending on your location, you may have the right to:</p>
          <ul className="list-disc list-inside text-lg">
            <li>Access, update, or delete your personal data.</li>
            <li>Withdraw consent for marketing communications.</li>
            <li>Restrict or object to data processing.</li>
            <li>Lodge a complaint with a data protection authority.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-2">Cookies and Tracking</h2>
          <p className="text-lg">We use cookies to enhance user experience and analyze website traffic. You can manage cookie preferences in your browser settings.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-2">Third-Party Links</h2>
          <p className="text-lg">Our website may contain links to third-party websites. We are not responsible for their privacy practices, and we encourage you to review their policies.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-2">Changes to This Privacy Policy</h2>
          <p className="text-lg">We may update this policy periodically. We will notify users of significant changes through our website or email.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-2">Contact Us</h2>
          <p className="text-lg">If you have any questions about this Privacy Policy, please contact us at:</p>
          <p className="text-lg font-semibold">Email: <a href="mailto:support@edueats.com.au" className="text-blue-600 underline">support@edueats.com.au</a></p>
        </section>
      </div>
    </div>
  );
}