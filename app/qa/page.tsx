"use client";

import { useState } from "react";
import { formatLocaleDate } from "@/lib/formatDate";

interface Question {
  id: string;
  question: string;
  answer?: string;
  category: string;
  createdAt: string;
  answeredAt?: string;
}

interface FAQItem {
  question: string;
  answer: string;
}

const faqItems: FAQItem[] = [
  {
    question: "What should I do if I like a villa or another property?",
    answer: "Click the Request Information button on the property page and choose the option that best fits your situation. We will review your request and follow up with the next steps."
  },
  {
    question: "How does the rental or purchase process work?",
    answer: "If you choose a villa and would like to view it, we will request your WhatsApp number and connect you directly with the agent or the property owner. You can then arrange the viewing and discuss details together."
  },
  {
    question: "Can I request a discount?",
    answer: "Discounts are discussed only after you have viewed the property, confirmed that it suits your needs, and shown serious interest. Please avoid requesting large discounts upfront. All listed prices reflect realistic and fair market rates."
  },
  {
    question: "Do you offer budget rooms or guesthouses?",
    answer: "We do not specialize in low-budget rooms, guesthouses, or rentals under 10 million IDR per month. However, such listings may occasionally appear in the catalog."
  },
  {
    question: "How can I view and reserve a villa if I am not in Bali?",
    answer: "Please arrange a trusted person on the island to view the property on your behalf and place a small deposit to reserve it, if needed."
  },
  {
    question: "Who do I sign the contract with, and who receives the payment?",
    answer: "All contracts are signed directly with the property owner, and payments are made only to the owner."
  },
  {
    question: "Why are most properties located in Ubud?",
    answer: "We live and are based in Ubud, and it is our primary area of expertise and focus. Over time, we plan to expand our coverage to more regions across Bali."
  }
];

const categoryLabels: Record<string, string> = {
  rent: "Rent",
  buy: "Buy",
  legal: "Legal",
  offer: "Offer something",
  other: "Other"
};

const categories = ["rent", "buy", "legal", "offer", "other"];

// Temporary demo data
const mockQuestions: Question[] = [
  {
    id: "1",
    question: "Looking for a family villa 3-4 bedrooms, quiet, Ubud, from a year. What do you recommend?",
    category: "rent",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    answer: "For families with children in Ubud, I recommend paying attention to Penestanan and Sayan areas. They are quieter than the center, but still convenient for living. It's important to check for parking availability and territory safety."
  }
];

export default function QAPage() {
  const [questions, setQuestions] = useState<Question[]>(mockQuestions);
  const [showForm, setShowForm] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [newQuestion, setNewQuestion] = useState({
    question: "",
    category: "rent"
  });

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const scrollToForm = () => {
    setShowForm(true);
    setTimeout(() => {
      const formElement = document.getElementById('question-form');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here will be the logic for submitting the question
    alert("Question submitted. Answer will be published after moderation.");
    setShowForm(false);
    setNewQuestion({ question: "", category: "rent" });
  };

  // Filter questions by category
  const filteredQuestions = selectedCategory
    ? questions.filter((q) => q.category === selectedCategory)
    : questions;

  // Group questions by category
  const groupedQuestions = filteredQuestions.reduce((acc, question) => {
    if (!acc[question.category]) {
      acc[question.category] = [];
    }
    acc[question.category].push(question);
    return acc;
  }, {} as Record<string, Question[]>);

  const categoriesWithQuestions = Object.keys(groupedQuestions).sort();

  return (
    <div className="bg-white min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Q&A
            </h1>
            <p className="text-xl text-gray-600 mb-6">
              Ask a question about real estate in Bali. Answers are published after moderation 
              and help other people make informed decisions.
            </p>
            <button
              onClick={showForm ? () => setShowForm(false) : scrollToForm}
              className="px-6 py-3 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors"
            >
              {showForm ? "Cancel" : "Ask a Question"}
            </button>
          </div>

          {/* FAQ Section */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Q&A — Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {faqItems.map((faq, index) => (
                <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-semibold text-gray-900 pr-4">{faq.question}</span>
                    <svg
                      className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform ${
                        openFaqIndex === index ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  {openFaqIndex === index && (
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                      <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {showForm && (
            <form id="question-form" onSubmit={handleSubmit} className="mb-12 p-6 bg-gray-50 rounded-lg">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Category
                </label>
                <select
                  value={newQuestion.category}
                  onChange={(e) => setNewQuestion({ ...newQuestion, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500"
                >
                  <option value="rent">Rent</option>
                  <option value="buy">Buy</option>
                  <option value="legal">Legal</option>
                  <option value="offer">Offer something</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Your Question
                </label>
                <textarea
                  value={newQuestion.question}
                  onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
                  rows={5}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500"
                  placeholder="Describe your question in detail..."
                  required
                />
              </div>
              <button
                type="submit"
                className="px-6 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors"
              >
                Submit Question
              </button>
            </form>
          )}

          {/* Category Filters */}
          {questions.length > 0 && (
            <div className="mb-8">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    selectedCategory === null
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      selectedCategory === cat
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {categoryLabels[cat]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Questions grouped by category */}
          <div className="space-y-12">
            {filteredQuestions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">
                  {selectedCategory
                    ? `No questions in "${categoryLabels[selectedCategory]}" category yet.`
                    : "No published questions yet. Be the first!"}
                </p>
              </div>
            ) : (
              categoriesWithQuestions.map((category) => (
                <div key={category}>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    {categoryLabels[category] || category}
                  </h2>
                  <div className="space-y-8">
                    {groupedQuestions[category].map((q) => (
                      <article key={q.id} className="border-b border-gray-200 pb-8">
                        <div className="mb-4 flex items-center gap-3 flex-wrap">
                          <span className="text-sm text-gray-500">
                            {formatLocaleDate(q.createdAt)}
                          </span>
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                            {categoryLabels[q.category] || q.category}
                          </span>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">
                          {q.question}
                        </h3>
                        {q.answer ? (
                          <div className="bg-gray-50 p-6 rounded-lg">
                            <p className="text-gray-700 whitespace-pre-line">{q.answer}</p>
                            {q.answeredAt && (
                              <p className="text-sm text-gray-500 mt-4">
                                Answer published {formatLocaleDate(q.answeredAt)}
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-gray-500 italic">
                            Question under moderation. Answer will be published soon.
                          </p>
                        )}
                      </article>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Bottom Ask Question Button */}
          <div className="mt-12 text-center">
            <button
              onClick={showForm ? () => setShowForm(false) : scrollToForm}
              className="px-6 py-3 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors"
            >
              {showForm ? "Cancel" : "Ask a Question"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
