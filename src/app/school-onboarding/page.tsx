import SchoolOnboardingForm from '@/components/SchoolOnboardingForm';

export default function SchoolOnboardingPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow px-6 py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-gray-900">
              School Registration
            </h1>
            <p className="mt-4 text-lg text-gray-600">
              Register your school to manage and monitor student orders
            </p>
          </div>
          
          <SchoolOnboardingForm />
        </div>
      </div>
    </div>
  );
}
