import React from 'react';
import Link from 'next/link';

const FAQItem = ({ question, answer }: { question: string; answer: string }) => (
  <div className="mb-6">
    <h3 className="text-lg font-semibold text-[#00A7A2] mb-2">{question}</h3>
    <p className="text-gray-700">{answer}</p>
  </div>
);

const FAQPage = () => {
  const faqs = [
    {
      question: "What is EduEats?",
      answer: "EduEats is a food delivery service specifically designed for students on campus. We partner with local restaurants to bring delicious meals directly to your dorm or campus location."
    },
    {
      question: "How do I place an order?",
      answer: "To place an order, simply log in to your EduEats account, browse the menu, select your items, and proceed to checkout. You can pay online using various payment methods."
    },
    {
      question: "What are the delivery hours?",
      answer: "Our delivery hours are from 10 AM to 10 PM, seven days a week. However, specific restaurant availability may vary."
    },
    {
      question: "Is there a minimum order amount?",
      answer: "The minimum order amount may vary depending on the restaurant. You can check the minimum order requirement on each restaurant's page."
    },
    {
      question: "How long does delivery take?",
      answer: "Delivery times typically range from 30-45 minutes, depending on your location and the restaurant's preparation time. You can track your order in real-time through our app."
    },
    {
      question: "Do you offer vegetarian or vegan options?",
      answer: "Yes, we have a wide range of vegetarian and vegan options available. You can use filters in our app to find restaurants and meals that cater to your dietary preferences."
    },
    {
      question: "How can I become a delivery driver for EduEats?",
      answer: "If you're interested in becoming a delivery driver, please visit our 'Become a Driver' page and fill out the application form. We'll review your application and get back to you soon."
    },
    {
      question: "What if there's an issue with my order?",
      answer: "If you encounter any issues with your order, please contact our customer support team immediately through the app or website. We're here to help and will resolve any problems as quickly as possible."
    }
  ];

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-[#00A7A2] mb-8">Frequently Asked Questions</h1>
        <div className="bg-white shadow-md rounded-lg p-6">
          {faqs.map((faq, index) => (
            <FAQItem key={index} question={faq.question} answer={faq.answer} />
          ))}
        </div>
        <div className="mt-8 text-center">
          <p className="text-gray-700">
            Can't find the answer you're looking for? Contact our support team at{' '}
            <a href="mailto:support@edueats.com" className="text-[#00A7A2] hover:underline">
              support@edueats.com
            </a>
          </p>
          <Link href="/" className="mt-4 inline-block bg-[#00A7A2] text-white py-2 px-4 rounded hover:bg-[#008C87] transition duration-300">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FAQPage;