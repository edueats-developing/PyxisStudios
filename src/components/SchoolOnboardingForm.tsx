'use client'

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function SchoolOnboardingForm() {
  const [schoolName, setSchoolName] = useState('');
  const [emailDomain, setEmailDomain] = useState('');
  const [studentCount, setStudentCount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('Not authenticated');

      // Create school record
      const { error: schoolError } = await supabase
        .from('schools')
        .insert([
          {
            name: schoolName,
            admin_id: user.id,
            email_domain: emailDomain.toLowerCase(),
            student_count: parseInt(studentCount),
            status: 'pending'
          }
        ]);

      if (schoolError) throw schoolError;

      // Update user profile as school_admin
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ role: 'school_admin' })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Redirect to school admin dashboard
      window.location.href = '/school-admin';
    } catch (err) {
      console.error('Error during school onboarding:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during onboarding');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-2xl font-bold mb-6">School Onboarding</h2>
      
      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded-md mb-4">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="schoolName" className="block text-sm font-medium text-gray-700">
          School Name
        </label>
        <input
          type="text"
          id="schoolName"
          value={schoolName}
          onChange={(e) => setSchoolName(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          required
        />
      </div>

      <div>
        <label htmlFor="emailDomain" className="block text-sm font-medium text-gray-700">
          School Email Domain
        </label>
        <div className="mt-1 flex rounded-md shadow-sm">
          <span className="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 text-gray-500 sm:text-sm">
            @
          </span>
          <input
            type="text"
            id="emailDomain"
            value={emailDomain}
            onChange={(e) => setEmailDomain(e.target.value)}
            placeholder="school.vic.edu.au"
            className="block w-full rounded-none rounded-r-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Students will use this domain to automatically join your school
        </p>
      </div>

      <div>
        <label htmlFor="studentCount" className="block text-sm font-medium text-gray-700">
          Approximate Student Count
        </label>
        <input
          type="number"
          id="studentCount"
          value={studentCount}
          onChange={(e) => setStudentCount(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
          loading ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {loading ? 'Processing...' : 'Submit'}
      </button>
    </form>
  );
}
