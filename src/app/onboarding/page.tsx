import ConnectedAccountForm from '@/components/ConnectedAccountForm';

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">
            Restaurant Partner Onboarding
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Create your connected account to start accepting payments
          </p>
        </div>
        <ConnectedAccountForm />
      </div>
    </div>
  );
}
