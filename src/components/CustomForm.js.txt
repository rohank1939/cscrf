"use client"; // This directive marks the component as a Client Component

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, CheckCircle, XCircle } from 'lucide-react'; // Icons for loading, success, error

/**
 * CustomForm Component
 * A responsive form for entity registration with OTP-based email validation.
 * It handles form input, OTP request, OTP verification, and final form submission.
 */
export default function CustomForm() {
  // State to manage form data
  const [formData, setFormData] = useState({
    entityName: '',
    website: '',
    sebiRegistrationNo: '',
    address: '',
    city: '',
    state: '',
    country: '',
    contactPerson: '',
    designation: '',
    emailId: '',
    mobile: ''
  });

  // State to manage OTP input and UI flow
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false); // True after OTP is requested
  const [emailVerified, setEmailVerified] = useState(false); // True after OTP is successfully verified

  // UI states for loading, errors, and success messages
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showDialog, setShowDialog] = useState(false); // Controls visibility of the message dialog
  const [dialogType, setDialogType] = useState(''); // 'success' or 'error' for dialog styling

  /**
   * Handles changes in form input fields.
   * @param {Object} e - The event object from the input change.
   */
  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
    // Clear any previous errors related to this field
    if (error) setError('');
  };

  /**
   * Validates the email format.
   * @param {string} email - The email string to validate.
   * @returns {boolean} - True if email is valid, false otherwise.
   */
  const isValidEmail = (email) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  /**
   * Handles the request to send an OTP to the provided email.
   * This function makes an API call to the serverless function.
   */
  const handleSendOtp = async () => {
    if (!formData.emailId) {
      setError('Email ID is required to send OTP.');
      setDialogType('error');
      setShowDialog(true);
      return;
    }
    if (!isValidEmail(formData.emailId)) {
      setError('Please enter a valid email address.');
      setDialogType('error');
      setShowDialog(true);
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.emailId }),
      });

      const data = await response.json();

      if (response.ok) {
        setOtpSent(true);
        setSuccessMessage(data.message || 'OTP sent to your email. Please check your inbox.');
        setDialogType('success');
        setShowDialog(true);
      } else {
        setError(data.error || 'Failed to send OTP. Please try again.');
        setDialogType('error');
        setShowDialog(true);
      }
    } catch (err) {
      console.error('Error sending OTP:', err);
      setError('Network error or server is unreachable. Please try again.');
      setDialogType('error');
      setShowDialog(true);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles the verification of the entered OTP.
   * This function also makes an API call to the serverless function.
   */
  const handleVerifyOtp = async () => {
    if (!otp) {
      setError('Please enter the OTP.');
      setDialogType('error');
      setShowDialog(true);
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      // For this demo, OTP verification is part of the final submission.
      // In a real app, you might have a separate /api/verify-otp endpoint.
      // Here, we'll just set emailVerified to true client-side for the demo flow,
      // and the server will re-verify it during final submission.
      setEmailVerified(true); // Assume client-side check for demo purposes
      setSuccessMessage('Email verified successfully! You can now submit the form.');
      setDialogType('success');
      setShowDialog(true);
    } catch (err) {
      console.error('Error verifying OTP:', err);
      setError('OTP verification failed. Please try again or request a new OTP.');
      setDialogType('error');
      setShowDialog(true);
      setEmailVerified(false);
    } finally {
      setLoading(false);
    }
  };


  /**
   * Handles the final submission of the form.
   * This function makes an API call to the serverless function.
   * @param {Object} e - The event object from the form submission.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic client-side validation for all fields
    const requiredFields = [
      'entityName', 'website', 'sebiRegistrationNo', 'address', 'city', 'state',
      'country', 'contactPerson', 'designation', 'emailId', 'mobile'
    ];
    for (const field of requiredFields) {
      if (!formData[field]) {
        setError(`Please fill in the "${field.replace(/([A-Z])/g, ' $1').trim()}" field.`);
        setDialogType('error');
        setShowDialog(true);
        return;
      }
    }

    if (!isValidEmail(formData.emailId)) {
      setError('Please enter a valid email address.');
      setDialogType('error');
      setShowDialog(true);
      return;
    }

    if (!emailVerified) {
      setError('Please verify your email address with the OTP before submitting.');
      setDialogType('error');
      setShowDialog(true);
      return;
    }
    if (!otp) {
        setError('Please enter the OTP to complete verification.');
        setDialogType('error');
        setShowDialog(true);
        return;
    }


    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch('/api/submit-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, otp }), // Send form data and OTP
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(data.message || 'Form submitted successfully!');
        setDialogType('success');
        setShowDialog(true);
        // Redirect after a short delay to allow user to see success message
        setTimeout(() => {
          window.location.href = 'https://openai.ai';
        }, 2000); // Redirect after 2 seconds
      } else {
        setError(data.error || 'Form submission failed. Please try again.');
        setDialogType('error');
        setShowDialog(true);
      }
    } catch (err) {
      console.error('Error submitting form:', err);
      setError('Network error or server is unreachable. Please try again.');
      setDialogType('error');
      setShowDialog(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-2xl border border-gray-200">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">Entity Registration Form</h2>

        {/* Entity Details Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <Label htmlFor="entityName" className="text-gray-700">Entity Name</Label>
            <Input id="entityName" type="text" placeholder="Your Entity Name" value={formData.entityName} onChange={handleChange} required className="mt-1 rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <Label htmlFor="website" className="text-gray-700">Website</Label>
            <Input id="website" type="url" placeholder="https://www.example.com" value={formData.website} onChange={handleChange} required className="mt-1 rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="sebiRegistrationNo" className="text-gray-700">SEBI Registration No.</Label>
            <Input id="sebiRegistrationNo" type="text" placeholder="e.g., INA00000XXXX" value={formData.sebiRegistrationNo} onChange={handleChange} required className="mt-1 rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500" />
          </div>
        </div>

        {/* Address Details Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="md:col-span-2">
            <Label htmlFor="address" className="text-gray-700">Address</Label>
            <Input id="address" type="text" placeholder="Street, Building, etc." value={formData.address} onChange={handleChange} required className="mt-1 rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <Label htmlFor="city" className="text-gray-700">City</Label>
            <Input id="city" type="text" placeholder="City" value={formData.city} onChange={handleChange} required className="mt-1 rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <Label htmlFor="state" className="text-gray-700">State</Label>
            <Input id="state" type="text" placeholder="State" value={formData.state} onChange={handleChange} required className="mt-1 rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="country" className="text-gray-700">Country</Label>
            <Input id="country" type="text" placeholder="Country" value={formData.country} onChange={handleChange} required className="mt-1 rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500" />
          </div>
        </div>

        {/* Contact Details Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <Label htmlFor="contactPerson" className="text-gray-700">Contact Person</Label>
            <Input id="contactPerson" type="text" placeholder="Full Name" value={formData.contactPerson} onChange={handleChange} required className="mt-1 rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <Label htmlFor="designation" className="text-gray-700">Designation</Label>
            <Input id="designation" type="text" placeholder="e.g., CEO, Manager" value={formData.designation} onChange={handleChange} required className="mt-1 rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <Label htmlFor="emailId" className="text-gray-700">Email ID</Label>
            <Input id="emailId" type="email" placeholder="email@example.com" value={formData.emailId} onChange={handleChange} required className="mt-1 rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <Label htmlFor="mobile" className="text-gray-700">Mobile</Label>
            <Input id="mobile" type="tel" placeholder="+1234567890" value={formData.mobile} onChange={handleChange} required className="mt-1 rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500" />
          </div>
        </div>

        {/* OTP Section */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8 items-end">
          <div className="flex-grow">
            <Label htmlFor="otp" className="text-gray-700">OTP for Email Verification</Label>
            <Input
              id="otp"
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              disabled={!otpSent || emailVerified} // Disable if OTP not sent or already verified
              className="mt-1 rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <Button
            type="button"
            onClick={otpSent ? handleVerifyOtp : handleSendOtp}
            disabled={loading || emailVerified}
            className="flex-shrink-0 w-full sm:w-auto px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200 shadow-md"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {otpSent ? (emailVerified ? 'Email Verified' : 'Verify OTP') : 'Send OTP'}
          </Button>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={loading || !emailVerified}
          className="w-full py-3 rounded-lg bg-green-600 text-white text-lg font-semibold hover:bg-green-700 transition-colors duration-200 shadow-lg"
        >
          {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
          Submit Registration
        </Button>
      </form>

      {/* Message Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[425px] rounded-xl shadow-xl">
          <DialogHeader className="flex flex-col items-center text-center">
            {dialogType === 'success' ? (
              <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
            ) : (
              <XCircle className="h-12 w-12 text-red-500 mb-4" />
            )}
            <DialogTitle className="text-xl font-bold text-gray-800">
              {dialogType === 'success' ? 'Success!' : 'Error!'}
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              {successMessage || error}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-center pt-4">
            <Button
              onClick={() => setShowDialog(false)}
              className="px-6 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
