import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Mail, Users, CheckCircle } from 'lucide-react';

const PendingApprovalPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-xl p-8 text-center">
          {/* Icon */}
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="h-10 w-10 text-yellow-600" />
          </div>

          {/* Header */}
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Account Under Review
          </h1>
          
          <p className="text-gray-600 mb-6 leading-relaxed">
            Thank you for registering! Your profile has been submitted and is currently being reviewed by our team.
          </p>

          {/* Status Steps */}
          <div className="space-y-4 mb-8">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm text-gray-700">Profile submitted</span>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                <Clock className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm text-gray-700">Under admin review</span>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                <Users className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm text-gray-500">Access granted</span>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <Mail className="h-5 w-5 text-blue-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  What happens next?
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    You'll receive an email notification once your profile is approved. 
                    This usually takes 1-2 business days.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Link
              to="/"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-700 transition-colors inline-block"
            >
              Return to Home
            </Link>
            
            <Link
              to="/search"
              className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md font-medium hover:bg-gray-200 transition-colors inline-block"
            >
              Browse Alumni Profiles
            </Link>
          </div>

          {/* Contact */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Questions? Contact us at{' '}
              <a href="mailto:admin@alumni.org" className="text-blue-600 hover:text-blue-700">
                admin@alumni.org
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendingApprovalPage;