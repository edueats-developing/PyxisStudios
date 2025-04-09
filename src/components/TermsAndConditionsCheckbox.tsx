'use client';
import { useState } from 'react';

export default function TermsAndConditionsCheckbox({ 
  isAccepted, 
  setIsAccepted 
}: {
  isAccepted: boolean;
  setIsAccepted: (value: boolean) => void;
}) {
  const [showTerms, setShowTerms] = useState(false);
  
  return (
    <div className="mb-4">
      <div className="flex items-start">
        <input
          type="checkbox"
          id="terms"
          checked={isAccepted}
          onChange={(e) => setIsAccepted(e.target.checked)}
          className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          required
        />
        <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
          I agree to the 
          <button
            type="button"
            onClick={() => setShowTerms(true)}
            className="ml-1 text-indigo-600 hover:text-indigo-500 underline focus:outline-none"
          >
            Terms and Conditions
          </button>
        </label>
      </div>
      
      {/* Modal/Popup for Terms */}
      {showTerms && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => setShowTerms(false)}></div>
            </div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Terms and Conditions</h3>
                    <div className="mt-2 max-h-96 overflow-y-auto">
                      <div className="text-sm text-gray-500 space-y-4">
                        <h4 className="font-medium text-gray-700">1. ACCEPTANCE OF TERMS</h4>
                        <p>
                          By accessing and using the EduEats platform as a Restaurant Partner, you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our services.
                        </p>
                        
                        <h4 className="font-medium text-gray-700">2. RESTAURANT PARTNER SERVICES</h4>
                        <p>
                          As a Restaurant Partner, you agree to provide food preparation and packaging services for orders placed through the EduEats platform. You are responsible for maintaining high standards of food quality, safety, and hygiene in accordance with all applicable laws and regulations.
                        </p>
                        
                        <h4 className="font-medium text-gray-700">3. PAYMENT PROCESSING</h4>
                        <p>
                          EduEats will process payments from customers on your behalf. Funds will be transferred to your designated account according to the payment schedule outlined in your Restaurant Partner Agreement, minus applicable service fees and commissions.
                        </p>
                        
                        <h4 className="font-medium text-gray-700">4. COMMISSION AND FEES</h4>
                        <p>
                          You agree to pay EduEats the commission rate specified in your Restaurant Partner Agreement. This commission is calculated as a percentage of the total order value (excluding taxes and delivery fees) and will be deducted from payments made to you.
                        </p>
                        
                        <h4 className="font-medium text-gray-700">5. MENU AND PRICING</h4>
                        <p>
                          You are responsible for providing accurate menu information, including prices, descriptions, and allergen information. You agree to maintain the same prices on the EduEats platform as you do for in-store purchases.
                        </p>
                        
                        <h4 className="font-medium text-gray-700">6. ORDER FULFILLMENT</h4>
                        <p>
                          You agree to prepare orders promptly upon receipt and have them ready for pickup by the designated time. Repeated late or incomplete orders may result in penalties or termination of your Restaurant Partner status.
                        </p>
                        
                        <h4 className="font-medium text-gray-700">7. CUSTOMER SERVICE</h4>
                        <p>
                          You agree to address customer complaints regarding food quality, missing items, or incorrect orders in a timely and professional manner. EduEats reserves the right to issue refunds to customers in accordance with our customer satisfaction policy.
                        </p>
                        
                        <h4 className="font-medium text-gray-700">8. INTELLECTUAL PROPERTY</h4>
                        <p>
                          You grant EduEats a non-exclusive license to use your restaurant name, logo, menu items, and other materials for marketing and promotional purposes on our platform and in our advertising.
                        </p>
                        
                        <h4 className="font-medium text-gray-700">9. TERM AND TERMINATION</h4>
                        <p>
                          Either party may terminate the Restaurant Partner relationship with 30 days' written notice. EduEats reserves the right to immediately terminate the relationship for violations of these terms, applicable laws, or food safety standards.
                        </p>
                        
                        <h4 className="font-medium text-gray-700">10. INDEMNIFICATION</h4>
                        <p>
                          You agree to indemnify and hold harmless EduEats, its affiliates, officers, directors, employees, and agents from any claims, damages, liabilities, costs, or expenses arising from your breach of these terms or any applicable laws or regulations.
                        </p>
                        
                        <h4 className="font-medium text-gray-700">11. LIMITATION OF LIABILITY</h4>
                        <p>
                          EduEats shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including lost profits, arising out of or in connection with your use of our services, even if we have been advised of the possibility of such damages.
                        </p>
                        
                        <h4 className="font-medium text-gray-700">12. GOVERNING LAW</h4>
                        <p>
                          These Terms and Conditions shall be governed by and construed in accordance with the laws of Australia, without regard to its conflict of law provisions.
                        </p>
                        
                        <h4 className="font-medium text-gray-700">13. MODIFICATIONS</h4>
                        <p>
                          EduEats reserves the right to modify these Terms and Conditions at any time. We will provide notice of significant changes through the platform or via email. Your continued use of our services after such modifications constitutes your acceptance of the updated terms.
                        </p>
                        
                        <h4 className="font-medium text-gray-700">14. ENTIRE AGREEMENT</h4>
                        <p>
                          These Terms and Conditions, together with your Restaurant Partner Agreement, constitute the entire agreement between you and EduEats regarding your use of our services, superseding any prior agreements.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => setShowTerms(false)}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
