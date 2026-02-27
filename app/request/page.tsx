"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { areas } from "@/types/areas";

type RequestType = "client-rent" | "client-other" | "owner" | "specialist";

function RequestForm() {
  const searchParams = useSearchParams();
  const propertyId = searchParams.get("property");
  
  const [requestType, setRequestType] = useState<RequestType | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    whatsapp: "",
    preferredContact: "email" as "email" | "whatsapp",
    propertyType: "",
    area: "",
    bedrooms: "",
    budget: "",
    budgetPeriod: "month" as "month" | "year",
    budgetCurrency: "IDR" as "USD" | "IDR",
    duration: [] as string[],
    message: ""
  });

  // Format WhatsApp number
  const formatWhatsApp = (value: string) => {
    // Remove all non-digit characters except +
    let cleaned = value.replace(/[^\d+]/g, '');
    
    // Ensure + at the start
    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned.replace(/\+/g, '');
    }
    
    // Limit length
    if (cleaned.length > 16) {
      cleaned = cleaned.substring(0, 16);
    }
    
    return cleaned;
  };

  const handleWhatsAppChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatWhatsApp(e.target.value);
    setFormData({ ...formData, whatsapp: formatted });
  };

  // Pre-fill form if property ID is provided
  useEffect(() => {
    if (propertyId && !requestType) {
      setRequestType("client-rent");
      setFormData(prev => ({
        ...prev,
        message: `I'm interested in property ${propertyId}. Please provide more information.`
      }));
    }
  }, [propertyId, requestType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here will be the logic for submitting the form
    alert("Request submitted. We will contact you shortly.");
    // Reset form
    setRequestType(null);
    setFormData({
      name: "",
      email: "",
      whatsapp: "",
      preferredContact: formData.whatsapp ? "whatsapp" : "email",
      propertyType: "",
      area: "",
      bedrooms: "",
      budget: "",
      budgetPeriod: "month",
      budgetCurrency: "IDR",
      duration: [],
      message: ""
    });
  };

  const toggleDuration = (value: string) => {
    setFormData(prev => ({
      ...prev,
      duration: prev.duration.includes(value)
        ? prev.duration.filter(d => d !== value)
        : [...prev.duration, value]
    }));
  };

  // Main areas - Ubud first, then others
  const mainAreas = [
    { value: "ubud", label: areas.ubud.nameEn },
    { value: "canggu", label: areas.canggu.nameEn },
    { value: "sanur", label: areas.sanur.nameEn },
    { value: "other", label: "Other" },
  ];

  const requestTypeOptions = [
    {
      id: "client-rent" as RequestType,
      title: "I'm a client",
      subtitle: "Help me find property",
      icon: "🏠"
    },
    {
      id: "client-other" as RequestType,
      title: "I'm a client",
      subtitle: "Other questions",
      icon: "❓"
    },
    {
      id: "owner" as RequestType,
      title: "I'm an owner or agent",
      subtitle: "Want to list property",
      icon: "📋"
    },
    {
      id: "specialist" as RequestType,
      title: "I'm a specialist",
      subtitle: "Ready to help with legal questions, etc.",
      icon: "⚖️"
    }
  ];

  return (
    <div className="bg-white min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Send Request
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Choose how we can help you and fill out the form.
          </p>

          {/* Request Type Selection */}
          {!requestType ? (
            <div className="grid md:grid-cols-2 gap-4 mb-12">
              {requestTypeOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setRequestType(option.id)}
                  className="p-6 border-2 border-gray-200 rounded-lg hover:border-gray-900 hover:shadow-lg transition-all text-left group"
                >
                  <div className="text-3xl mb-3">{option.icon}</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-gray-900">
                    {option.title}
                  </h3>
                  <p className="text-sm text-gray-600">{option.subtitle}</p>
                </button>
              ))}
            </div>
          ) : (
            <>
              {/* Back button */}
              <button
                onClick={() => setRequestType(null)}
                className="mb-6 text-gray-600 hover:text-gray-900 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to options
              </button>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Name and Email - side by side */}
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-900 mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-900 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500"
                    />
                  </div>
                </div>

                {/* WhatsApp */}
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-900 mb-1">
                      WhatsApp <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <input
                      type="tel"
                      value={formData.whatsapp}
                      onChange={handleWhatsAppChange}
                      placeholder="+1234567890"
                      className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500"
                    />
                    <p className="mt-0.5 text-xs text-gray-400">Include country code, e.g., +1, +62</p>
                  </div>
                  <div></div>
                </div>

                {/* Preferred Contact */}
                {formData.whatsapp && (
                  <div>
                    <label className="block text-xs font-medium text-gray-900 mb-1">
                      Preferred contact method
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="preferredContact"
                          value="email"
                          checked={formData.preferredContact === "email"}
                          onChange={(e) => setFormData({ ...formData, preferredContact: "email" })}
                          className="mr-1.5"
                        />
                        <span className="text-xs">Email</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="preferredContact"
                          value="whatsapp"
                          checked={formData.preferredContact === "whatsapp"}
                          onChange={(e) => setFormData({ ...formData, preferredContact: "whatsapp" })}
                          className="mr-1.5"
                        />
                        <span className="text-xs">WhatsApp</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Client Rent Specific Fields */}
                {requestType === "client-rent" && (
                  <>
                    {/* Property Type and Area - side by side */}
                    <div className="grid md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-900 mb-1">
                          Property Type
                        </label>
                        <select
                          value={formData.propertyType}
                          onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
                          className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500"
                        >
                          <option value="">Select...</option>
                          <option value="rent">Rent a villa</option>
                          <option value="buy">Buy a villa</option>
                          <option value="land">Land</option>
                          <option value="business">Business</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-900 mb-1">
                          Area
                        </label>
                        <select
                          value={formData.area}
                          onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                          className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500"
                        >
                          <option value="">Any</option>
                          {mainAreas.map(area => (
                            <option key={area.value} value={area.value}>
                              {area.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Budget */}
                    <div>
                      <label className="block text-xs font-medium text-gray-900 mb-1">
                        Budget
                      </label>
                      <div className="flex gap-2 items-start">
                        <div className="md:w-1/2">
                          <input
                            type="number"
                            value={formData.budget}
                            onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                            placeholder="Amount"
                            className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500"
                          />
                        </div>
                        <div className="flex gap-1.5">
                          {formData.propertyType === "rent" && (
                            <div className="flex items-center border border-gray-300 rounded-md px-2 py-1">
                              <label className="flex items-center mr-2">
                                <input
                                  type="radio"
                                  name="budgetPeriod"
                                  value="month"
                                  checked={formData.budgetPeriod === "month"}
                                  onChange={(e) => setFormData({ ...formData, budgetPeriod: "month" })}
                                  className="mr-1"
                                />
                                <span className="text-xs">month</span>
                              </label>
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  name="budgetPeriod"
                                  value="year"
                                  checked={formData.budgetPeriod === "year"}
                                  onChange={(e) => setFormData({ ...formData, budgetPeriod: "year" })}
                                  className="mr-1"
                                />
                                <span className="text-xs">year</span>
                              </label>
                            </div>
                          )}
                          <select
                            value={formData.budgetCurrency}
                            onChange={(e) => setFormData({ ...formData, budgetCurrency: e.target.value as "USD" | "IDR" })}
                            className="px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500"
                          >
                            <option value="USD">usd</option>
                            <option value="IDR">idr</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Duration */}
                    <div>
                      <label className="block text-xs font-medium text-gray-900 mb-1">
                        Duration
                      </label>
                      <div className="flex gap-4">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.duration.includes("monthly")}
                            onChange={() => toggleDuration("monthly")}
                            className="mr-1.5"
                          />
                          <span className="text-xs">Monthly</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.duration.includes("yearly")}
                            onChange={() => toggleDuration("yearly")}
                            className="mr-1.5"
                          />
                          <span className="text-xs">Yearly</span>
                        </label>
                      </div>
                    </div>
                  </>
                )}

                {/* Owner Specific Fields */}
                {requestType === "owner" && (
                  <>
                    {/* Property Type */}
                    <div>
                      <label className="block text-xs font-medium text-gray-900 mb-1">
                        Property Type
                      </label>
                      <select
                        value={formData.propertyType}
                        onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500"
                      >
                        <option value="">Select...</option>
                        <option value="rent">Rent a villa</option>
                        <option value="buy">Buy a villa</option>
                        <option value="land">Land</option>
                        <option value="business">Business</option>
                      </select>
                    </div>

                    {/* Bedrooms - only for Rent or Buy */}
                    {(formData.propertyType === "rent" || formData.propertyType === "buy") && (
                      <div>
                        <label className="block text-xs font-medium text-gray-900 mb-1">
                          Number of bedrooms
                        </label>
                        <select
                          value={formData.bedrooms}
                          onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                          className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500"
                        >
                          <option value="">Select...</option>
                          <option value="1">1</option>
                          <option value="2">2</option>
                          <option value="3">3</option>
                          <option value="4">4</option>
                          <option value="5+">5+</option>
                        </select>
                      </div>
                    )}

                    {/* Area */}
                    <div>
                      <label className="block text-xs font-medium text-gray-900 mb-1">
                        Area
                      </label>
                      <select
                        value={formData.area}
                        onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500"
                      >
                        <option value="">Select...</option>
                        {mainAreas.map(area => (
                          <option key={area.value} value={area.value}>
                            {area.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Price and Currency */}
                    <div>
                      <label className="block text-xs font-medium text-gray-900 mb-1">
                        Price
                      </label>
                      <div className="flex gap-2 items-start">
                        <div className="md:w-1/2">
                          <input
                            type="number"
                            value={formData.budget}
                            onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                            placeholder="Amount"
                            className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500"
                          />
                        </div>
                        <select
                          value={formData.budgetCurrency}
                          onChange={(e) => setFormData({ ...formData, budgetCurrency: e.target.value as "USD" | "IDR" })}
                          className="px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500"
                        >
                          <option value="USD">usd</option>
                          <option value="IDR">idr</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}

                {/* Message */}
                <div>
                  <label className="block text-xs font-medium text-gray-900 mb-1">
                    {requestType === "client-rent" 
                      ? <>Additional details <span className="text-gray-400 font-normal">(optional)</span></>
                      : requestType === "client-other"
                      ? "Your question *"
                      : requestType === "owner"
                      ? "Tell us about your property *"
                      : "Tell us how you can help *"}
                  </label>
                  <textarea
                    required={requestType !== "client-rent"}
                    rows={requestType === "client-rent" ? 3 : 4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder={
                      requestType === "client-rent"
                        ? "Describe what you're looking for, property requirements, when you plan to move..."
                        : requestType === "client-other"
                        ? "Ask your question..."
                        : requestType === "owner"
                        ? "Describe your property: type, area, characteristics, rental/sale conditions..."
                        : "Describe your expertise and how you can help..."
                    }
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors mt-4"
                >
                  Submit Request
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RequestPage() {
  return (
    <Suspense fallback={
      <div className="bg-white min-h-screen">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Send Request</h1>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    }>
      <RequestForm />
    </Suspense>
  );
}
