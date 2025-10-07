import React, { useState, useEffect, useRef } from 'react';

// ============================================================================
// API Integration
// ============================================================================

// Production backend URL on Render
// For local development, change this to 'http://localhost:8000'
const API_BASE_URL = 'https://insurance-backend-2mhv.onrender.com/api';

// Log the API URL for debugging
console.log('🔗 API Base URL:', API_BASE_URL);

// API Service Functions
const fetchPoliciesFromAPI = async () => {
  try {
    console.log('📡 Fetching policies from:', `${API_BASE_URL}/policies?limit=100`);
    const response = await fetch(`${API_BASE_URL}/policies?limit=100`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching policies:', error);
    return [];
  }
};

const askGeminiQuestion = async (policy, question, chatHistory = []) => {
  try {
    const response = await fetch(`${API_BASE_URL}/gemini`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        policy_id: policy.id,
        policy_name: policy.name,
        policy_company: policy.company,
        product_uin: policy.product_uin,
        question: question,
        chat_history: chatHistory,
        model: 'gemini-2.5-pro'
      }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return {
      response: data.response,
      followUpQuestions: data.follow_up_questions || []
    };
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw error;
  }
};

// ============================================================================
// Mock/Fallback Data for policies (used if API fails)
// ============================================================================
const fallbackPoliciesData = [
  // Health Policies (5 total)
  {
    id: 'health-cocure',
    type: 'Health',
    company: 'Cocure Insurance',
    name: 'Cocure Health Plan',
    shortDescription: 'Comprehensive health coverage for individuals and families.',
    priceRange: '5,000 - 20,000 / year',
    mustHave: [
      'Claim Settlement Ratio.',
      'Hospital Network.',
      'Room Rent.',
      'Copayment.',
      'Restoration Benefit.',
      'Pre & Post Hospitalisation Coverage'
    ],
    goodToHave: [
      'Waiting Period.',
      'No Claim Bonus.',
      'Disease Sub limits.',
      'Alternate Treatment Coverage.',
      'Maternity Care.',
      'Newborn Care.',
      'Health Checkups.',
    ],
    addOns: [
    'Domiciliary.',
    'Outpatient Department.',
    'Lifelong Renewal.',
    'Critical Illness Rider.',
    'Accident & Disability Ride.',
    ],
    rating: 4.5,
    reviewsCount: 1200
  },
  {
    id: 'health-primecare',
    type: 'Health',
    company: 'PrimeCare Health',
    name: 'PrimeCare Family Floater',
    shortDescription: 'Flexible health plan covering entire family under one policy.',
    priceRange: '8,000 - 30,000 / year',
    mustHave: [
      'Claim Settlement Ratio.',
      'Hospital Network.',
      'Room Rent.',
      'Copayment.',
      'Restoration Benefit.',
      'Pre & Post Hospitalisation Coverage'
    ],
    goodToHave: [
      'Waiting Period.',
      'No Claim Bonus.',
      'Disease Sub limits.',
      'Alternate Treatment Coverage.',
      'Maternity Care.',
      'Newborn Care.',
      'Health Checkups.'
    ],
    addOns: [
        'Domiciliary.',
        'Outpatient Department.',
        'Lifelong Renewal.',
        'Critical Illness Rider.',
        'Accident & Disability Ride.',
    ],
    rating: 4.4,
    reviewsCount: 800
  },
  {
    id: 'health-medishield',
    type: 'Health',
    company: 'MediShield Plus',
    name: 'MediShield Platinum',
    shortDescription: 'Premium health insurance with international coverage options.',
    priceRange: '15,000 - 50,000 / year',
    mustHave: [
      'Claim Settlement Ratio.',
      'Hospital Network.',
      'Room Rent.',
      'Copayment.',
      'Restoration Benefit.',
      'Pre & Post Hospitalisation Coverage'
    ],
    goodToHave: [
      'Waiting Period.',
      'No Claim Bonus.',
      'Disease Sub limits.',
      'Alternate Treatment Coverage.',
      'Maternity Care.',
      'Newborn Care.',
      'Health Checkups.'
    ],
    addOns: [
     'Domiciliary.',
    'Outpatient Department.',
    'Lifelong Renewal.',
    'Critical Illness Rider.',
    'Accident & Disability Ride.',
    ],
    rating: 4.8,
    reviewsCount: 650
  },
  {
    id: 'health-guardian',
    type: 'Health',
    company: 'Guardian Health',
    name: 'Guardian Family Care',
    shortDescription: 'Affordable family health plan with extensive network.',
    priceRange: '7,000 - 25,000 / year',
    mustHave: [
      'Claim Settlement Ratio.',
      'Hospital Network.',
      'Room Rent.',
      'Copayment.',
      'Restoration Benefit.',
      'Pre & Post Hospitalisation Coverage'
    ],
    goodToHave: [
      'Waiting Period.',
      'No Claim Bonus.',
      'Disease Sub limits.',
      'Alternate Treatment Coverage.',
      'Maternity Care.',
      'Newborn Care.',
      'Health Checkups.'
    ],
    addOns: [
      'Domiciliary.',
      'Outpatient Department.',
      'Lifelong Renewal.',
      'Critical Illness Rider.',
      'Accident & Disability Ride.',
    ],
    rating: 4.2,
    reviewsCount: 1050
  },
  {
    id: 'health-star',
    type: 'Health',
    company: 'Star Health',
    name: 'Star Comprehensive Plan',
    shortDescription: 'Wide coverage with add-on benefits for complete health protection.',
    priceRange: '6,000 - 22,000 / year',
    mustHave: [
      'Claim Settlement Ratio.',
      'Hospital Network.',
      'Room Rent.',
      'Copayment.',
      'Restoration Benefit.',
      'Pre & Post Hospitalisation Coverage'
    ],
    goodToHave: [
      'Waiting Period.',
      'No Claim Bonus.',
      'Disease Sub limits.',
      'Alternate Treatment Coverage.',
      'Maternity Care.',
      'Newborn Care.',
      'Health Checkups.'
    ],
    addOns: [
    'Domiciliary.',
    'Outpatient Department.',
    'Lifelong Renewal.',
    'Critical Illness Rider.',
    'Accident & Disability Ride.',
    ],
    rating: 4.6,
    reviewsCount: 1500
  },
  // Term Policies (5 total)
  {
    id: 'term-lifeshield',
    type: 'Term',
    company: 'Life Shield Insurance',
    name: 'Life Shield Term Plan',
    shortDescription: 'Financial security for your loved ones up to age 65.',
    priceRange: '10,000 - 30,000 / year',
    mustHave: [
      'High sum assured at affordable premiums.',
      'Death benefit paid as lump sum.',
      'Critical illness rider available.',
      'Accidental death benefit rider.',
      'Tax benefits under Section 80C and 10(10D).',
    ],
    goodToHave: [
      'Suicide within the first 12 months.',
      'Fraudulent claims.',
    ],
    addOns: [
      'Age: 18-60 years.',
      'Policy term up to 65 years of age.',
    ],
    rating: 4.7,
    reviewsCount: 950
  },
  {
    id: 'term-familysecure',
    type: 'Term',
    company: 'SecureLife Solutions',
    name: 'Family Secure Term Plan',
    shortDescription: 'Ensures long-term financial stability for your family.',
    priceRange: '12,000 - 40,000 / year',
    mustHave: [
      'Flexible premium payment options.',
      'Increased cover at key life stages (marriage, childbirth).',
      'Option to receive maturity benefit (Return of Premium).',
      'Terminal illness benefit.',
    ],
    goodToHave: [
      'Self-inflicted injury.',
      'Participation in criminal activities.',
    ],
    addOns: [
      'Age: 20-55 years.',
      'Policy term up to 75 years.',
    ],
    rating: 4.6,
    reviewsCount: 1100
  },
  {
    id: 'term-futureprotect',
    type: 'Term',
    company: 'FutureProtect Life',
    name: 'FutureProtect Income Plan',
    shortDescription: 'Provides regular income to your family in your absence.',
    priceRange: '8,000 - 28,000 / year',
    mustHave: [
      'Monthly income payout to beneficiaries.',
      'Increasing income option to beat inflation.',
      'Waiver of premium on disability.',
      'Accelerated death benefit.',
    ],
    goodToHave: [
      'Acts of terrorism (specific conditions apply).',
      'Consumption of illegal drugs.',
    ],
    addOns: [
      'Age: 21-50 years.',
      'Policy term: 10-40 years.',
    ],
    rating: 4.5,
    reviewsCount: 720
  },
  {
    id: 'term-digitalsecure',
    type: 'Term',
    company: 'Digital Secure Insurance',
    name: 'Digital Term Assurance',
    shortDescription: 'Online-only term plan with competitive rates and easy application.',
    priceRange: '7,000 - 25,000 / year',
    mustHave: [
      'Simplified underwriting process.',
      'Option to customize sum assured.',
      'Paperless application process.',
      'Claim assistance 24/7 online.',
    ],
    goodToHave: [
      'Hazardous occupation related death.',
      'Pre-existing critical illnesses (declaration required).',
    ],
    addOns: [
      'Age: 18-58 years.',
      'Policy term up to 85 years.',
    ],
    rating: 4.3,
    reviewsCount: 1800
  },
  {
    id: 'term-maxshield',
    type: 'Term',
    company: 'MaxShield Life',
    name: 'MaxShield Cover Plus',
    shortDescription: 'High coverage term plan with return of premium at maturity.',
    priceRange: '15,000 - 50,000 / year',
    mustHave: [
      'Return of premium paid if policyholder survives term.',
      'Enhanced cover for accidental death.',
      'Tax-free maturity benefit.',
      'Guaranteed additions for long-term policies.',
    ],
    goodToHave: [
      'Death during military service (specific clauses).',
      'Participation in riots or civil commotion.',
    ],
    addOns: [
      'Age: 25-60 years.',
      'Policy term: 15-30 years.',
    ],
    rating: 4.9,
    reviewsCount: 1300
  },
  // Motor Policies (5 total)
  {
    id: 'motor-driveprotect',
    type: 'Motor',
    company: 'DriveProtect Insurance',
    name: 'DriveProtect Comprehensive',
    shortDescription: 'All-round protection for your car against damage and theft.',
    priceRange: '3,000 - 15,000 / year',
    mustHave: [
      'Damage to own vehicle covered.',
      'Third-party liability cover.',
      'Personal accident cover for owner-driver.',
      '24/7 roadside assistance.',
      'Cashless garage network.',
    ],
    goodToHave: [
      'Wear and tear.',
      'Driving without a valid license.',
      'Damage due to war or nuclear risk.',
    ],
    addOns: [
      'Valid driving license required.',
      'Vehicle registration required.',
    ],
    rating: 4.3,
    reviewsCount: 2500
  },
  {
    id: 'motor-two-wheeler',
    type: 'Motor',
    company: 'SpeedSafe Insurance',
    name: 'Two-Wheeler Protect',
    shortDescription: 'Essential insurance for your motorcycle or scooter.',
    priceRange: '1,500 - 5,000 / year',
    mustHave: [
      'Mandatory third-party liability cover.',
      'Own damage cover for accidents and natural calamities.',
      'Theft protection.',
      'Personal accident cover for owner-driver.',
    ],
    goodToHave: [
      'Consequential loss.',
      'Mechanical or electrical breakdown.',
      'Driving under influence of alcohol/drugs.',
    ],
    addOns: [
      'Valid driving license.',
      'Valid vehicle registration.',
    ],
    rating: 4.1,
    reviewsCount: 1500
  },
  {
    id: 'motor-roadguard',
    type: 'Motor',
    company: 'RoadGuard General',
    name: 'RoadGuard Car Shield',
    shortDescription: 'Extensive car insurance with zero depreciation add-on.',
    priceRange: '4,000 - 18,000 / year',
    mustHave: [
      'Zero depreciation cover (bumper-to-bumper).',
      'No-claim bonus protection.',
      'Engine protector add-on.',
      'Key replacement cover.',
    ],
    goodToHave: [
      'General aging and wear and tear.',
      'Electrical/mechanical breakdown.',
      'Driving for illegal purposes.',
    ],
    addOns: [
      'Private cars, up to 5 years old for zero depreciation.',
      'Valid vehicle documents.',
    ],
    rating: 4.6,
    reviewsCount: 1900
  },
  {
    id: 'motor-autocare',
    type: 'Motor',
    company: 'AutoCare Insurance',
    name: 'AutoCare Supreme',
    shortDescription: 'Premium motor insurance with personalized services.',
    priceRange: '5,000 - 25,000 / year',
    mustHave: [
      'Customizable add-ons (tyre protect, return to invoice).',
      'Dedicated claim manager.',
      'Hybrid/electric vehicle specific coverage.',
      'Daily car allowance during repairs.',
    ],
    goodToHave: [
      'Consequential damages.',
      'Loss due to war or invasion.',
      'Driving without a valid PUC certificate.',
    ],
    addOns: [
      'All types of registered private vehicles.',
      'Regular maintenance records.',
    ],
    rating: 4.7,
    reviewsCount: 1100
  },
  {
    id: 'motor-speedster',
    type: 'Motor',
    company: 'Speedster Insurance',
    name: 'Speedster Bike Shield',
    shortDescription: 'Specialized insurance for high-performance motorcycles.',
    priceRange: '2,500 - 10,000 / year',
    mustHave: [
      'Protection against theft and total loss.',
      'Riding gear cover add-on.',
      'Pillion rider personal accident cover.',
      'Instant policy issuance online.',
    ],
    goodToHave: [
      'Damage due to racing or rallies.',
      'Modifications not endorsed on RC.',
      'Overloading the vehicle.',
    ],
    addOns: [
      'All registered two-wheelers.',
      'Compliance with RTO rules.',
    ],
    rating: 4.2,
    reviewsCount: 850
  }
];

// Payment pricing structure
const PAYMENT_PRICING = {
  1: { price: 0, description: "Free" },
  2: { price: 90, description: "Standard Plan" },
  3: { price: 150, description: "Premium Plan" },
  4: { price: 200, description: "Advanced Plan" },
  5: { price: 250, description: "Complete Plan" }
};

// Hook to track window width for responsive behavior
function useWindowWidth() {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowWidth;
}

// AutoScrollingQuestions Component - For both mobile and desktop
const AutoScrollingQuestions = ({ questions, onQuestionClick, shouldScroll }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchEndX, setTouchEndX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const marqueeRef = useRef(null);
  
  // Auto-scroll suggested questions
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isPaused && shouldScroll) {
        setCurrentQuestionIndex(prev => (prev + 1) % questions.length);
      }
    }, 3000); // Change question every 3 seconds
    
    return () => clearInterval(interval);
  }, [questions.length, isPaused, shouldScroll]);
  
  // Handle touch/mouse start for swipe detection
  const handleStart = (clientX) => {
    setTouchStartX(clientX);
    setIsPaused(true);
    setIsSwiping(false);
  };
  
  // Handle touch/mouse move for swipe detection
  const handleMove = (clientX) => {
    setTouchEndX(clientX);
    setIsSwiping(true);
  };
  
  // Handle touch/mouse end for swipe detection
  const handleEnd = () => {
    if (isSwiping) {
      if (touchStartX - touchEndX > 75) {
        // Swipe left - go to next question
        setCurrentQuestionIndex(prev => (prev + 1) % questions.length);
      } else if (touchEndX - touchStartX > 75) {
        // Swipe right - go to previous question
        setCurrentQuestionIndex(prev => (prev - 1 + questions.length) % questions.length);
      }
    }
    setIsPaused(false);
    setIsSwiping(false);
  };
  
  // Touch event handlers for mobile
  const handleTouchStart = (e) => {
    handleStart(e.targetTouches[0].clientX);
  };
  
  const handleTouchMove = (e) => {
    handleMove(e.targetTouches[0].clientX);
  };
  
  const handleTouchEnd = () => {
    handleEnd();
  };
  
  // Mouse event handlers for desktop
  const handleMouseDown = (e) => {
    handleStart(e.clientX);
  };
  
  const handleMouseMove = (e) => {
    if (isSwiping) {
      handleMove(e.clientX);
    }
  };
  
  const handleMouseUp = () => {
    handleEnd();
  };
  
  return (
    <div className="w-full">
      {/* Mobile version - original behavior */}
      <div className="sm:hidden">
        <div 
          ref={marqueeRef}
          className="h-10 overflow-hidden relative"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div 
            className="absolute top-0 left-0 w-full h-full flex items-center justify-center transition-transform duration-1000 ease-in-out"
            style={{ 
              transform: `translateX(-${currentQuestionIndex * (100 / questions.length)}%)`,
              width: `${questions.length * 100}%`,
              transition: 'transform 1000ms ease-in-out'
            }}
          >
            {questions.map((question, index) => (
              <div 
                key={index} 
                className="flex-shrink-0 flex items-center justify-center px-2"
                style={{ width: `${100 / questions.length}%` }}
              >
                <button
                  onClick={() => {
                    onQuestionClick(question);
                  }}
                  className="h-10 inline-flex items-center justify-center text-xs text-cyan-800 px-4 transition-colors duration-200 whitespace-nowrap overflow-hidden text-ellipsis bg-cyan-100 hover:bg-cyan-200 rounded-full"
                  aria-label={`Ask: ${question}`}
                >
                  {question}
                </button>
              </div>
            ))}
          </div>
        </div>
        
        {/* Swipe indicators */}
        <div className="flex justify-center mt-1 space-x-1">
          {questions.map((_, index) => (
            <div 
              key={index} 
              className={`w-2 h-2 rounded-full ${index === currentQuestionIndex ? 'bg-gray-600' : 'bg-gray-300'}`}
            />
          ))}
        </div>
      </div>
      
      {/* Desktop version - continuous scrolling like ants */}
      <div className="hidden sm:block">
        <div className="h-10 overflow-hidden relative group">
          <div
            className="absolute top-0 left-0 h-full flex items-center whitespace-nowrap"
            style={{
              animation: shouldScroll ? 'marquee 30s linear infinite' : 'none'
            }}
          >
            {questions.map((question, index) => (
              <button
                key={index}
                onClick={() => onQuestionClick(question)}
                className="mx-2 h-10 inline-flex items-center justify-center text-xs text-cyan-800 px-4 transition-colors duration-200 whitespace-nowrap overflow-hidden text-ellipsis bg-cyan-100 hover:bg-cyan-200 rounded-full"
                aria-label={`Ask: ${question}`}
              >
                {question}
              </button>
            ))}
            {/* Duplicate for seamless loop */}
            {questions.map((question, index) => (
              <button
                key={`dup-${index}`}
                onClick={() => onQuestionClick(question)}
                className="mx-2 h-10 inline-flex items-center justify-center text-xs text-cyan-800 px-4 transition-colors duration-200 whitespace-nowrap overflow-hidden text-ellipsis bg-cyan-100 hover:bg-cyan-200 rounded-full"
                aria-label={`Ask: ${question}`}
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Full-screen Policy Features Dropdown for Desktop - Modified to keep panel open when feature is clicked
const PolicyFeaturesFullScreenDropdown = ({ 
  isOpen, 
  onClose, 
  onFeatureClick,
  policyFeatures 
}) => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [expandedCategoryId, setExpandedCategoryId] = useState(null);
  
  if (!isOpen) return null;

  // Toggle category expansion - only one can be open at a time
  const toggleCategory = (categoryId) => {
    setExpandedCategoryId(prev => prev === categoryId ? null : categoryId);
  };

  return (
    <>
      {/* Mobile version - Full screen modal */}
      <div className="sm:hidden fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-6xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-cyan-600 to-cyan-500 text-white">
            <h3 className="text-2xl font-bold">Policy Features</h3>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-cyan-700 rounded-full transition-colors duration-200"
              aria-label="Close policy features"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Content */}
          <div className="flex-grow overflow-y-auto p-6">
            {selectedCategory ? (
              <div>
                {/* Back button */}
                <button 
                  onClick={() => setSelectedCategory(null)}
                  className="flex items-center text-cyan-600 hover:text-cyan-800 mb-6 p-3 rounded-lg hover:bg-cyan-50 transition-colors duration-200 w-max"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7 7m0 0l7-7m-7 7h18" />
                  </svg>
                  <span className="text-base font-medium">Back to Categories</span>
                </button>
                
                {/* Category title and description */}
                <div className="mb-8">
                  <h4 className="text-2xl font-bold text-cyan-700 mb-3">{selectedCategory.title}</h4>
                  <p className="text-gray-600 text-lg">{selectedCategory.description}</p>
                </div>
                
                {/* Features list - Only send to chat, don't close panel */}
                <div className="space-y-4">
                  {selectedCategory.features.map((feature, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        onFeatureClick(feature);
                        // IMPORTANT: Removed onClose() call - panel stays open
                      }}
                      className="w-full text-left p-5 rounded-xl hover:bg-cyan-50 transition-colors duration-200 text-lg border border-gray-200 hover:border-cyan-300 group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-gray-800 group-hover:text-cyan-700 font-medium">{feature}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-500 opacity-0 group-hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7-7m7 7H3" />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-8 text-center">Select a feature category to explore</h3>
                
                {/* Category cards grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {policyFeatures.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category)}
                      className="bg-gradient-to-br from-cyan-50 to-blue-50 hover:from-cyan-100 hover:to-blue-100 rounded-2xl p-8 text-left transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg border border-cyan-100"
                    >
                      <div className="flex items-center mb-4">
                        <div className="w-12 h-12 rounded-full bg-cyan-100 flex items-center justify-center mr-4">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </div>
                        <div className="text-cyan-600 font-bold text-xl">{category.title}</div>
                      </div>
                      <div className="text-gray-600">{category.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="p-6 border-t border-gray-200 bg-gray-50 text-center">
            <p className="text-gray-600 text-sm">
              Click on any feature to learn more about it in the chat. Our advisor will provide detailed information tailored to your needs.
            </p>
          </div>
        </div>
      </div>
      
      {/* Desktop version - 25% side panel with inline dropdown */}
      <div className="hidden sm:flex fixed top-0 right-0 w-1/4 h-full bg-white shadow-xl z-50 flex flex-col border-l border-gray-200">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-cyan-600 to-cyan-500 text-white">
          <h3 className="text-xl font-bold">Policy Features</h3>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-cyan-700 rounded-full transition-colors duration-200"
            aria-label="Close policy features"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-grow overflow-y-auto p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">Select a feature category to explore</h3>
          
          {/* Inline dropdown categories */}
          <div className="space-y-3">
            {policyFeatures.map((category) => (
              <div key={category.id} className="border border-gray-200 rounded-lg overflow-hidden">
                {/* Category header with plus button */}
                <div 
                  className="flex items-center justify-between p-3 bg-cyan-50 hover:bg-cyan-100 cursor-pointer"
                  onClick={() => toggleCategory(category.id)}
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-cyan-600 font-bold text-sm">{category.title}</div>
                      <div className="text-gray-600 text-xs">{category.description}</div>
                    </div>
                  </div>
                  <button 
                    className="p-1 bg-white rounded-full shadow-sm"
                    aria-label={`${expandedCategoryId === category.id ? 'Collapse' : 'Expand'} ${category.title}`}
                  >
                    {expandedCategoryId === category.id ? (
                      // Down arrow icon when expanded
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l7 7m0 0l-7-7m7 7h18" />
                      </svg>
                    ) : (
                      // Plus icon when collapsed
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    )}
                  </button>
                </div>
                
                {/* Features dropdown - shown only when this category is expanded */}
                {expandedCategoryId === category.id && (
                  <div className="bg-white border-t border-gray-200 p-2">
                    {category.features.map((feature, index) => (
                      // Make the entire feature row clickable but don't close panel
                      <button
                        key={index}
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent event bubbling to category
                          onFeatureClick(feature);
                          // IMPORTANT: Removed onClose() call - panel stays open
                        }}
                        className="w-full flex items-center justify-between py-2 px-3 hover:bg-gray-50 rounded-lg transition-colors duration-200 group"
                      >
                        <span className="text-sm text-gray-700 group-hover:text-cyan-700 font-medium">{feature}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-cyan-500 opacity-0 group-hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7m0 0l-7-7m7 7h18" />
                        </svg>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 text-center">
          <p className="text-gray-600 text-xs">
            Click on any feature to learn more about it in the chat. Our advisor will provide detailed information tailored to your needs.
          </p>
        </div>
      </div>
    </>
  );
};
// Chat Policy Features Dropdown Component
const ChatPolicyFeaturesDropdown = ({ 
  isOpen, 
  onClose, 
  onFeatureClick,
  policyFeatures 
}) => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const dropdownRef = useRef(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);
  
  if (!isOpen) return null;
  
  return (
    <div 
      ref={dropdownRef}
      className="absolute top-16 right-4 w-80 bg-white shadow-xl rounded-lg z-50 border border-gray-200"
    >
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">Policy Features</h3>
        <button 
          onClick={onClose}
          className="p-1 text-gray-600 hover:bg-gray-200 rounded-full transition-colors duration-200"
          aria-label="Close policy features"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div className="p-2">
        {selectedCategory ? (
          <div>
            <button 
              onClick={() => setSelectedCategory(null)}
              className="flex items-center text-cyan-600 hover:text-cyan-800 mb-3 p-2 rounded hover:bg-gray-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7 7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="text-sm font-medium">Back to Categories</span>
            </button>
            
            <div className="mb-3">
              <h4 className="font-medium text-gray-800 mb-1">{selectedCategory.title}</h4>
              <p className="text-xs text-gray-600">{selectedCategory.description}</p>
            </div>
            
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {selectedCategory.features.map((feature, index) => (
                <button
                  key={index}
                  onClick={() => {
                    onFeatureClick(feature);
                    onClose();
                  }}
                  className="w-full text-left p-2 rounded hover:bg-cyan-50 transition-colors duration-200 text-sm"
                >
                  {feature}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {policyFeatures.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category)}
                className="w-full text-left p-3 rounded-lg hover:bg-gray-100 transition-colors duration-200 flex items-center justify-between group"
              >
                <div>
                  <div className="font-medium text-cyan-600">{category.title}</div>
                  <div className="text-xs text-gray-600 mt-1">{category.description}</div>
                </div>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5 text-gray-400 group-hover:text-gray-600" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7m0 0l-7-7m7 7h18" />
                </svg>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// TopBar Component - Mobile responsive adjustments
const TopBar = ({ 
  showBackButton, 
  onBackClick, 
  title, 
  showAuthButtons, 
  isChatScreen, 
  isChatSidebarOpen, 
  onToggleChatSidebar, 
  onLoginClick, 
  onSignUpClick, 
  onMenuClick, 
  isShowingComparisonScreen,
  isDirectChatAccess,
  onFeatureIconClick, // New prop for handling feature icon clicks
  showCloseButton, // New prop for showing close button
  onCloseClick, // New prop for close button click
  showPolicyFeaturesDropdown, // New prop for showing dropdown
  setShowPolicyFeaturesDropdown, // New prop setter for dropdown
  onDesktopFeatureClick, // New prop for handling feature clicks
  onChatPolicyFeaturesClick, // New prop for chat policy features button click
  onToggleChatHistorySidebar, // New prop for toggling chat history sidebar
  onMobileCheckMyPolicyClick, // New prop for mobile check my policy button click
  onMobilePolicyFeaturesClick // New prop for mobile policy features button click
}) => {
  return (
    <div className={`fixed top-0 left-0 right-0 p-2 sm:p-4 bg-cyan-800 shadow-sm text-sm text-white flex items-center z-10 w-full rounded-b-xl`} aria-label="Top navigation">
      {/* Left section: Hamburger for chat history, Back for other screens */}
      <div className="flex items-center">
        {/* Chat history hamburger menu - only on chat screen */}
        {isChatScreen && (
          <button 
            onClick={onToggleChatHistorySidebar}
            className="p-1 mr-2 text-white hover:bg-cyan-700 rounded-full transition-colors duration-200"
            aria-label="Toggle chat history"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
        
        {/* Conditional Back button for Chat screen when sidebar is CLOSED */}
        {isChatScreen && !isChatSidebarOpen && showBackButton && (
          <button onClick={onBackClick} className="p-1 mr-2 text-white hover:bg-cyan-700 rounded-full transition-colors duration-200" aria-label="Go back">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
          </button>
        )}
        {/* Branding/Title - always aligns with the visible elements on the left */}
        <div className={`flex items-baseline`}>
          {isChatScreen ? (
            <>
              <h1 className="text-lg sm:text-xl font-bold text-white">✓ PolicyAdvise</h1>
              <span className="text-xs text-cyan-200 ml-1 hidden sm:inline"></span>
            </>
          ) : (
            title ? (
              <span className="text-sm sm:text-base font-medium text-white flex-grow">{title}</span>
            ) : (
              <h1 className="text-lg sm:text-xl font-bold text-white">✓ PolicyAdvise</h1>
            )
          )}
        </div>
      </div>
      
      {/* Center section: Policy Features button - Only shown on chat screen and desktop */}
      {isChatScreen && (
        <div className="hidden sm:block absolute top-4 right-0 h-16 flex items-center pr-4 sm:pr-6">
          <div className="flex items-center">
            {/* Policy Features button */}
            <button 
              onClick={onChatPolicyFeaturesClick}
              className="flex items-center bg-white text-cyan-600 px-4 py-2 rounded-lg transition-colors duration-200 hover:bg-cyan-50"
              aria-label="Policy Features"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a4 4 0 11-8 0v2m8-2a4 4 0 108 0v2M5 19l2-2m-2 2l-2-2m7-10l-2-2m2 2l2-2" />
              </svg>
              <span>Policy Features</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l7 7m0 0l-7-7m7 7h18" />
              </svg>
            </button>
          </div>
        </div>
      )}
      
      {/* Right section: Auth Buttons or Close Button */}
      <div className="flex items-center space-x-1 sm:space-x-2 ml-auto">
        {showCloseButton ? (
          <button
            onClick={onCloseClick}
            className="p-1 text-white hover:bg-cyan-700 rounded-full transition-colors duration-200"
            aria-label="Close panel"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        ) : showAuthButtons ? (
          <>
            <button
              onClick={onLoginClick}
              className="px-2 sm:px-4 py-1 sm:py-2 text-white border border-white rounded-lg hover:bg-cyan-700 transition-colors duration-200 text-xs sm:text-sm font-medium"
              aria-label="Log in"
            >
              Log In
            </button>
            <button
              onClick={onSignUpClick}
              className="px-2 sm:px-4 py-1 sm:py-2 bg-white text-cyan-800 rounded-lg hover:bg-cyan-100 transition-colors duration-200 text-xs sm:text-sm font-medium"
              aria-label="Sign up"
            >
              Sign Up
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
};

// ScreenWrapper Component - Provides consistent padding and centering for screens
const ScreenWrapper = ({ children, isCentered = false, maxWidthClass = 'max-w-md', backgroundColor = 'bg-white' }) => (
  <div className={`flex flex-col flex-grow w-full rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6 md:p-8 ${maxWidthClass} mx-auto ${isCentered ? 'justify-center items-center' : ''} ${backgroundColor}`}>
    {children}
  </div>
);
// New HomeScreen Component with OTP Modal
const HomeScreen = ({ onCheckMyPolicyClick, onExplorePolicyTypesClick }) => {
  // Fixed developer video URL
  const developerVideoUrl = "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4";
  
  // State for OTP modal
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [mobileNumber, setMobileNumber] = useState('');
  
  // Handle button click
  const handleButtonClick = () => {
    setShowOtpModal(true);
  };
  
  // Handle sending OTP - MODIFIED: Directly navigate to chatbot
  const handleSendOtp = (e) => {
    e.preventDefault();
    // In a real app, you would send the OTP to the mobile number
    console.log(`Sending OTP to ${mobileNumber}`);
    // Close modal and navigate to chatbot screen
    setShowOtpModal(false);
    setMobileNumber('');
    onCheckMyPolicyClick();
  };
  
  // Close modal
  const closeModal = () => {
    setShowOtpModal(false);
    setMobileNumber('');
  };
  
  return (
    <div className="flex flex-col h-full bg-white w-full">
      {/* Hero Section - MODIFIED: Changed background to white */}
      <div className="w-screen -mx-4 sm:-mx-6 md:-mx-5 bg-white shadow-md py-12 mb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            {/* Left Column - Text Content */}
            <div className="md:w-1/2">
              {/* MODIFIED: Ensuring text appears in exactly two lines and centered on mobile */}
              <div className="text-center md:text-left">
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-800 leading-tight mb-6">
                  <span className="block">Get Unbinned, Instant Answers</span>
                  <span className="block">to Any Policy Question</span>
                </h1>
                <p className="text-xl text-gray-600 mb-10">
                  AI-powered, unbiased insurance policy analysis
                </p>
                
                <button 
                  onClick={handleButtonClick}
                  className="bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-700 hover:to-cyan-600 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition duration-300 transform hover:-translate-y-1 w-full max-w-xs mb-10 mx-auto md:mx-0"
                >
                  Start Analyzing My Policy
                </button>
              </div>
              
              {/* MODIFIED: Icons with updated styling for white background */}
              <div className="flex flex-col sm:flex-row justify-center md:justify-start items-center gap-10 mt-8">
                {/* Left Icon - Backed by AI */}
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 rounded-full bg-cyan-50 flex items-center justify-center mb-4 shadow-md">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <p className="text-lg font-medium text-gray-800 text-center">Backed by AI, not commissions</p>
                </div>
                
                {/* Right Icon - Covers Insurers */}
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 rounded-full bg-cyan-50 flex items-center justify-center mb-4 shadow-md">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <p className="text-lg font-medium text-gray-800 text-center">Covers 50+ insurers in India</p>
                </div>
              </div>
            </div>
           {/* Right Column - Illustration - MODIFIED: Image with white background removal */}
<div className="md:w-1/2 flex justify-center mt-8"> {/* Added mt-8 for top margin */}
  <div className="bg-transparent">
    <img 
      src="https://z-cdn-media.chatglm.cn/files/d4105b58-08a3-4bb8-b8f1-a3fe58c62593_pasted_image_1759210573710.jpg?auth_key=1790746581-6af68fe511a94e3b844fafe88b2f6605-0-c2511a8f3ad4d1143a1ce462975acc61" 
      alt="Policy analysis with security shield" 
      className="w-96 h-96 md:w-[32rem] md:h-[32rem] object-contain bg-transparent"
      style={{ 
        mixBlendMode: 'multiply',
        filter: 'brightness(1.1) contrast(1.1)'
      }}
    />
  </div>
</div>
          </div>
        </div>
      </div>
      
      {/* OTP Login Modal - SIMPLIFIED: Only phone number input */}
      {showOtpModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          {/* Blurred background */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={closeModal}
          ></div>
          
          {/* Modal content */}
          <div className="relative bg-white rounded-2xl shadow-xl p-8 w-full max-w-md mx-4 z-10">
            {/* Close button */}
            <button 
              onClick={closeModal}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </button>
            
            {/* Modal header */}
            <div className="text-center mb-6">
              <div className="mx-auto bg-cyan-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Enter Your Mobile Number</h2>
              <p className="text-gray-600 mt-2">
                We'll send you an OTP for verification
              </p>
            </div>
            
            {/* Mobile Number Form */}
            <form onSubmit={handleSendOtp}>
              <div className="mb-6">
                <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 mb-1">
                  Mobile Number
                </label>
                <div className="flex">
                  <div className="flex-shrink-0 z-10 inline-flex items-center py-2.5 px-4 text-sm font-medium text-gray-500 bg-gray-50 border border-r-0 border-gray-300 rounded-l-lg">
                    +91
                  </div>
                  <input
                    type="tel"
                    id="mobile"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-r-lg focus:ring-cyan-500 focus:border-cyan-500 block w-full p-2.5"
                    placeholder="Enter 10-digit mobile number"
                    pattern="[0-9]{10}"
                    maxLength={10}
                    required
                  />
                </div>
              </div>
              
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-700 hover:to-cyan-600 text-white font-bold py-3 px-4 rounded-xl shadow-md transition duration-300"
              >
                Get OTP & Continue
              </button>
            </form>
          </div>
        </div>
      )}
      
      {/* Thin divider line between sections */}
      <div className="w-screen -mx-4 sm:-mx-6 md:-mx-5 border-t border-gray-200 my-0"></div>
      
      {/* Extended How PolicyAdvise Works Section - Full width cyan background */}
      <div className="w-screen -mx-4 sm:-mx-6 md:-mx-5 bg-gradient-to-r from-cyan-50 to-blue-50 shadow-md py-12 mb-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Left side - Heading - Centered on mobile, right-aligned on desktop */}
            <div className="md:w-1/3 flex flex-col items-center md:items-start md:justify-start md:pr-14 pt-8">
              <h2 className="text-4xl sm:text-6xl font-bold text-gray-800 text-center md:text-left">How PolicyAdvise Works</h2>
            </div>
            
            {/* Right side - Content */}
            <div className="md:w-2/3">
              {/* Description section */}
              <div className="mb-6">
                <p className="text-gray-600 text-lg mb-4">
                  PolicyAdvise simplifies insurance policy analysis with our AI-powered platform.
                </p>
                
                {/* Features section - Single white box containing three points */}
                <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
                  {/* Feature 1: Simple 3-Step Process */}
                  <div className="flex items-start mb-8">
                    <div className="flex-shrink-0 mt-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="font-bold text-xl text-gray-800">Simple 3-Step Process</p>
                      <p className="text-lg text-gray-600 font-medium">Share your needs → Compare policies → Get unbiased advice</p>
                    </div>
                  </div>
                  
                  {/* Feature 2: AI-Powered Analysis */}
                  <div className="flex items-start mb-8">
                    <div className="flex-shrink-0 mt-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="font-bold text-xl text-gray-800">AI-Powered Analysis</p>
                      <p className="text-lg text-gray-600 font-medium">Our advanced algorithms analyze policies to find the best match for you</p>
                    </div>
                  </div>
                  
                  {/* Feature 3: Expert Support */}
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="font-bold text-xl text-gray-800">Expert Support</p>
                      <p className="text-lg text-gray-600 font-medium">Get help from certified insurance advisors when you need it</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Video section */}
              <div>
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="relative">
                    <video 
                      src={developerVideoUrl} 
                      controls 
                      className="w-full max-h-64 object-contain bg-black"
                      poster="https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80"
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                  
                  <div className="p-4 flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-800">PolicyAdvise Explainer Video</p>
                      <p className="text-sm text-gray-500">Learn how our platform works in 2 minutes</p>
                    </div>
                    
                    <div className="flex space-x-2">
                      <a 
                        href={developerVideoUrl}
                        download
                        className="bg-cyan-600 text-white px-4 py-2 rounded-lg hover:bg-cyan-700 transition-colors"
                        aria-label="Download video"
                      >
                        Download
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Extended What Customer Know Section - Full width cyan background */}
      <div className="w-screen -mx-4 sm:-mx-6 md:-mx-5 bg-gradient-to-r from-cyan-50 to-blue-50 shadow-md py-12 mb-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Left side - What Customer Know (centered with larger heading) */}
            <div className="md:w-1/3 flex flex-col items-center md:items-start md:justify-start md:pr-40 pt-8">
              <h2 className="text-4xl sm:text-6xl font-bold text-gray-800 text-center md:text-left">What Customer Know</h2>
            </div>
            
            {/* Right side - Two Comparison Boxes with larger text */}
            <div className="md:w-2/3 flex flex-col md:flex-row gap-6">
              {/* Traditional Agents Box - Larger text */}
              <div className="flex-1 bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-200 transform hover:scale-105 transition-transform duration-300">
                <div className="flex items-center mb-5">
                  <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">What Insurance Agents Do</h2>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <p className="ml-3 text-lg text-gray-700">Sell policies for their benefit, not yours</p>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <p className="ml-3 text-lg text-gray-700">Exploit your lack of knowledge</p>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <p className="ml-3 text-lg text-gray-700">Provide half-truths about benefits</p>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <p className="ml-3 text-lg text-gray-700">Hide important policy exclusions</p>
                  </div>
                </div>
              </div>
              
              {/* Policy Advisors Box - Larger text */}
              <div className="flex-1 bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-200 transform hover:scale-105 transition-transform duration-300">
                <div className="flex items-center mb-5">
                  <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">What Policy Advisors Do</h2>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="ml-3 text-lg text-gray-700">Full transparency in policy details</p>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="ml-3 text-lg text-gray-700">24/7 availability for assistance</p>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="ml-3 text-lg text-gray-700">Offer unbiased advice and expertise</p>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="ml-3 text-lg text-gray-700">Guide you to ask key questions</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Extended Your Benefit Section - Full width cyan background - MODIFIED TO ALIGN HEADING */}
      <div className="w-screen -mx-4 sm:-mx-6 md:-mx-5 bg-gradient-to-r from-cyan-50 to-blue-50 shadow-md py-12 mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* MODIFIED: Changed alignment to match other sections */}
            <div className="md:w-1/3 flex flex-col items-center md:items-start md:justify-start md:pr-14 pt-8">
              <h2 className="text-4xl sm:text-6xl font-bold text-gray-800 text-center md:text-left">Benefits</h2>
            </div>
            
            {/* Right side - Benefits and Image */}
            <div className="md:w-2/3 flex flex-col md:flex-row gap-8">
              {/* Benefits List */}
              <div className="md:w-1/2">
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                  <h3 className="text-xl font-semibold text-cyan-700 mb-4">Save Money</h3>
                  <p className="text-gray-600">Avoid unexpected costs and hidden fees with transparent policy information.</p>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                  <h3 className="text-xl font-semibold text-cyan-700 mb-4">Better Coverage</h3>
                  <p className="text-gray-600">Get recommendations that truly suit your needs, not what earns the highest commission.</p>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-xl font-semibold text-cyan-700 mb-4">Peace of Mind</h3>
                  <p className="text-gray-600">Make informed decisions with complete confidence in your insurance choices.</p>
                </div>
              </div>
              
              {/* Image */}
              <div className="md:w-1/2 flex justify-center items-center">
                <img 
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80" 
                  alt="Insurance benefits illustration" 
                  className="rounded-xl shadow-lg max-w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="mt-auto p-4 border-t border-gray-200 flex justify-center space-x-6 text-sm text-gray-500">
        <a href="#" className="hover:text-cyan-600">Privacy</a>
        <a href="#" className="hover:text-cyan-600">Terms</a>
        <a href="#" className="hover:text-cyan-600">Contact</a>
      </div>
    </div>
  );
};
// SignUpScreen Component - User registration page
const SignUpScreen = ({ onBack, onLoginClick }) => (
  <ScreenWrapper>
    <div className="w-full flex items-center mb-6 sm:mb-8">
      {/* Back button specific to this screen */}
      <button onClick={onBack} className="p-2 mr-4 text-gray-600 hover:bg-gray-200 rounded-full transition-colors duration-200" aria-label="Go back">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-gray-800 text-center flex-grow">
        Sign Up
      </h1>
    </div>
    <div className="flex flex-col items-center flex-grow justify-center w-full space-y-4">
      {/* Input for Name */}
      <input
        type="text"
        placeholder="Name"
        className="w-full max-w-xs p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-400 font-inter"
        aria-label="Full name"
      />
      {/* Input for Password */}
      <input
        type="password"
        placeholder="Password"
        className="w-full max-w-xs p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-400 font-inter"
        aria-label="Password"
      />
      {/* Forgot Password link */}
      <button className="text-cyan-600 text-sm hover:underline self-end max-w-xs w-full text-right font-inter bg-transparent border-none p-0 cursor-pointer">
        Forgot Password?
      </button>
    </div>
    <div className="w-full max-w-xs flex flex-col items-center mt-6 sm:mt-8">
      <button
        className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-cyan-300 w-full mb-4"
        aria-label="Sign up"
      >
        Sign Up
      </button>
      <button
        onClick={onLoginClick}
        className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-cyan-300 w-full"
        aria-label="Log in"
      >
        Log in
      </button>
    </div>
  </ScreenWrapper>
);

// LoginScreen Component - User login page
const LoginScreen = ({ onBack, onSignUpClick }) => (
  <ScreenWrapper>
    <div className="w-full flex items-center mb-6 sm:mb-8">
      {/* Back button specific to this screen */}
      <button onClick={onBack} className="p-2 mr-4 text-gray-600 hover:bg-gray-200 rounded-full transition-colors duration-200" aria-label="Go back">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-gray-800 text-center flex-grow">
        Log In
      </h1>
    </div>
    <div className="flex flex-col items-center flex-grow justify-center w-full space-y-4">
      {/* Input for Email */}
      <input
        type="email"
        placeholder="Email"
        className="w-full max-w-xs p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-400 font-inter"
        aria-label="Email"
      />
      {/* Input for Password */}
      <input
        type="password"
        placeholder="Password"
        className="w-full max-w-xs p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-400 font-inter"
        aria-label="Password"
      />
      {/* Forgot Password link */}
      <button className="text-cyan-600 text-sm hover:underline self-end max-w-xs w-full text-right font-inter bg-transparent border-none p-0 cursor-pointer">
        Forgot Password?
      </button>
    </div>
    <div className="w-full max-w-xs flex flex-col items-center mt-6 sm:mt-8">
      <button
        className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-cyan-300 w-full mb-4"
        aria-label="Log in"
      >
        Log In
      </button>
      <button
        onClick={onSignUpClick}
        className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-cyan-300 w-full"
        aria-label="Sign up"
      >
        Sign Up
      </button>
    </div>
  </ScreenWrapper>
);

// ChatHistorySidebar Component - Displays user account, chat history, and close button
const ChatHistorySidebar = ({ 
  isOpen, 
  onNewChat, 
  onToggleChatSidebar,
  chatHistories,
  currentChatId,
  onSelectChat,
  userSubscription
}) => {
  return (
    <div className={`fixed inset-y-0 left-0 w-full sm:w-1/5 bg-white shadow-xl z-20 flex flex-col rounded-r-xl sm:rounded-r-xl border-r border-gray-200 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-cyan-600 text-white">
        <h2 className="text-xl font-bold">Menu</h2>
        <button onClick={onToggleChatSidebar} className="p-1 text-white hover:bg-cyan-700 rounded-full transition-colors duration-200" aria-label="Close sidebar">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* User Account Section */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center mb-2">
          <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <p className="font-medium">User Name</p>
            <p className="text-sm text-gray-600">user@example.com</p>
          </div>
        </div>
        <div className="mt-2">
          <span className={`inline-block px-2 py-1 text-xs rounded-full ${userSubscription === 'Subscribed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
            {userSubscription}
          </span>
        </div>
      </div>

      {/* New Chat Button */}
      <div className="p-4">
       
      </div>

      {/* Chat History */}
      <div className="flex-grow overflow-y-auto px-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Chat History</h3>
        <div className="space-y-2">
          {chatHistories.map((chat) => (
            <button
              key={chat.id}
              onClick={() => {
                onSelectChat(chat.id);
                onToggleChatSidebar(); // Close sidebar after selection
              }}
              className={`w-full text-left p-3 rounded-lg transition-colors duration-200 ${
                currentChatId === chat.id
                  ? 'bg-cyan-100 text-cyan-800'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
              aria-label={`Open chat: ${chat.title}`}
            >
              <div className="font-medium truncate">{chat.title}</div>
              <div className="text-xs text-gray-500">
                {chat.messages.length} messages
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// PolicyCard Component - Mobile responsive adjustments
const PolicyCard = ({ 
  policy, 
  onGetAdvice, 
  onCompareClick, 
  isSelectedForComparison, 
  disableCompareButton,
  isPolicyForAdvice
}) => {
  return (
    <div className={`bg-white rounded-xl shadow-md p-3 sm:p-4 border 
      ${isPolicyForAdvice ? 'border-purple-400 ring-2 ring-purple-200' : isSelectedForComparison ? 'border-purple-400 ring-2 ring-purple-200' : 'border-gray-200'} 
      hover:shadow-lg transition-shadow duration-200 relative`}>
      
      {/* Star icon for policy selected for advice */}
      {isPolicyForAdvice && (
        <div className="absolute top-20 right-2 text-purple-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </div>
      )}
      
      {/* Main content with dynamic right alignment */}
      <div className="flex flex-col sm:flex-row justify-between items-start">
        {/* Left side - Policy details */}
        <div className="flex-1 pr-0 sm:pr-6 mb-3 sm:mb-0">
          <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-1">{policy.name}</h2>
          <p className="text-gray-600 text-xs sm:text-sm mb-1">{policy.company}</p>
          <p className="text-gray-600 text-xs sm:text-sm">{policy.shortDescription}</p>
        </div>
        
        {/* Right side - Price and reviews moved more to the left */}
        <div className="flex flex-col items-end text-right min-w-[80px] sm:min-w-[90px] ml-0 sm:ml-4">
          <div className="text-xs sm:text-sm text-gray-700 mb-2">
            <div className="font-medium">Price: {policy.priceRange}</div>
          </div>
          <div className="flex flex-col items-end">
            <div className="text-xs sm:text-sm text-purple-500 mb-1">
              {'★'.repeat(Math.floor(policy.rating))}
              {policy.rating % 1 !== 0 && '★'}
            </div>
            <div className="text-xs text-gray-600">({policy.reviewsCount} reviews)</div>
          </div>
        </div>
      </div>
      
      {/* Centered action buttons */}
      <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-3 mt-4">
        <button
          onClick={() => onGetAdvice(policy)}
          className={`py-2 px-4 rounded-lg transition-colors duration-200 text-xs sm:text-sm font-medium
            ${isPolicyForAdvice 
              ? 'bg-purple-500 text-white hover:bg-purple-600' 
              : 'bg-cyan-100 text-cyan-700 hover:bg-cyan-200'
            }`}
          aria-label={`Get unbiased advice for ${policy.name}`}
        >
          Get Unbiased Advice
        </button>
        <button
          onClick={() => onCompareClick(policy)}
          disabled={disableCompareButton && !isSelectedForComparison}
          className={`py-2 px-4 rounded-lg transition-colors duration-200 text-xs sm:text-sm font-medium
            ${isSelectedForComparison
              ? 'bg-purple-500 text-white hover:bg-purple-600 shadow-md'
              : disableCompareButton && !isSelectedForComparison
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          aria-label={`${isSelectedForComparison ? 'Selected for comparison' : `Compare ${policy.name}`}`}
          aria-pressed={isSelectedForComparison}
        >
          {isSelectedForComparison ? 'Selected' : 'Compare'}
        </button>
      </div>
    </div>
  );
};

// PolicyListingScreen Component - Mobile responsive adjustments
const PolicyListingScreen = React.forwardRef(({ 
  onBack, 
  onGetAdvice,
  policyType, 
  onSelectPolicyType, 
  showCancelButton, 
  onCancel, 
  onUploadDocument, 
  onCompareClick, 
  comparisonFeedback, 
  policiesToCompare, 
  onClearComparison, 
  onInitiateSelectedComparison,
  policiesData  // Add policiesData prop
}, ref) => {
    // State for sorting options
    const [sortOption, setSortOption] = useState('rating-high');
    
    // Filter policies based on the policyType prop
    const filteredPolicies = policiesData.filter(policy => policy.type === policyType);
    
    // Sort policies based on selected sort option
    const sortedPolicies = [...filteredPolicies].sort((a, b) => {
        switch(sortOption) {
            case 'price-low':
                // Extract minimum price from priceRange string and compare
                const aMinPrice = parseInt(a.priceRange.split('-')[0].replace(/[^\d]/g, ''));
                const bMinPrice = parseInt(b.priceRange.split('-')[0].replace(/[^\d]/g, ''));
                return aMinPrice - bMinPrice;
            case 'price-high':
                const aMaxPrice = parseInt(a.priceRange.split('-')[1].replace(/[^\d]/g, ''));
                const bMaxPrice = parseInt(b.priceRange.split('-')[1].replace(/[^\d]/g, ''));
                return bMaxPrice - aMaxPrice;
            case 'rating-low':
                return a.rating - b.rating;
            case 'rating-high':
            default:
                return b.rating - a.rating;
        }
    });
    
    // Construct a dynamic title based on policyType
    const screenTitle = policyType ? `${policyType} Plans` : 'All Recommended Plans'; // Fallback for safety
    
    // Determine if compare buttons should be disabled
    const disableOtherCompareButtons = policiesToCompare.length >= 5; // Updated to 5
    
    return (
        <div ref={ref} id="policy-listing-section" className="flex flex-col h-full bg-gray-50 w-full max-w-5xl mx-auto rounded-xl shadow-lg border border-gray-200 overflow-y-auto mt-8">
            <div className="flex-grow p-4 sm:p-6 md:p-8">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6">
                    <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold text-gray-800 mb-3 sm:mb-0">
                        {screenTitle} {/* Dynamic title */}
                    </h1>
                    
                    {/* Sorting Options */}
                    <div className="flex items-center space-x-2 w-full sm:w-auto">
                        <span className="text-gray-700 font-medium text-sm sm:text-base">Sort by:</span>
                        <select 
                            value={sortOption} 
                            onChange={(e) => setSortOption(e.target.value)}
                            className="px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 text-sm w-full sm:w-auto"
                            aria-label="Sort policies"
                        >
                            <option value="rating-high">Rating (High to Low)</option>
                            <option value="rating-low">Rating (Low to High)</option>
                            <option value="price-low">Price (Low to High)</option>
                            <option value="price-high">Price (High to Low)</option>
                        </select>
                    </div>
                </div>
                
                {comparisonFeedback && (
                    <div className="mb-4 sm:mb-6 p-2 sm:p-3 bg-cyan-100 text-cyan-800 rounded-lg text-center font-medium flex flex-col sm:flex-row justify-between items-center">
                        <span className="text-sm sm:text-base">{comparisonFeedback}</span>
                        {policiesToCompare.length > 0 && ( // Show clear button only if at least one policy is selected
                            <button
                                onClick={onClearComparison}
                                className="mt-2 sm:mt-0 sm:ml-4 px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300 transition-colors duration-200"
                                aria-label="Clear all selections"
                            >
                                Clear All
                            </button>
                        )}
                    </div>
                )}
                
                {policyType && filteredPolicies.length > 0 && (
                    <p className="text-gray-600 mb-6 sm:mb-8 text-sm sm:text-base">
                      Here are some recommended {policyType.toLowerCase()} policies that might match your needs.
                    </p>
                )}
                
                {/* Policy Cards Grid - Vertical Column Layout */}
                <div className="flex flex-col gap-4 sm:gap-6">
                    {sortedPolicies.map((policy) => (
                        <PolicyCard
                            key={policy.id}
                            policy={policy}
                            onGetAdvice={onGetAdvice}
                            onCompareClick={onCompareClick}
                            isSelectedForComparison={policiesToCompare.some(p => p.id === policy.id)}
                            disableCompareButton={disableOtherCompareButtons} // Pass the new prop
                            isPolicyForAdvice={false} // Not used in this screen
                        />
                    ))}
                </div>
                
                {/* This div now ALWAYS contains the explanatory text and the upload button.
                    The text itself is now UNCONDITIONAL, appearing for all scenarios where policyType is set. */}
                <div className="mt-6 sm:mt-10 text-center">
                    {policyType && ( // Display this message if a policy type is selected
                        <p className="text-gray-700 text-base sm:text-lg font-semibold mb-4">
                           
                        </p>
                    )}
                    {!policyType && ( // Display this message if no policy type is selected
                        <p className="text-gray-500 text-base sm:text-lg mb-4">Please select a policy type to see plans.</p>
                    )}
                    {/* Upload Document Button - Always visible on this screen */}
                   
                </div>
            </div>
            
            {/* Floating comparison bar */}
            {policiesToCompare.length > 0 && (
                <div className="fixed bottom-4 sm:bottom-6 left-1/2 transform -translate-x-1/2 bg-white p-2 sm:p-4 shadow-lg border border-gray-200 rounded-xl flex justify-center items-center space-x-2 sm:space-x-4 z-30 w-11/12 sm:w-auto">
                    <button
                        onClick={onInitiateSelectedComparison}
                        disabled={policiesToCompare.length < 1}
                        className={`font-bold py-2 sm:py-3 px-4 sm:px-8 rounded-xl shadow-lg transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 text-sm sm:text-base
                            ${policiesToCompare.length >= 1 ? 'bg-purple-500 hover:bg-purple-600 text-white focus:ring-purple-300 shadow-xl' : 
                                'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                        aria-label={`Compare ${policiesToCompare.length} policies`}
                    >
                        Compare ({policiesToCompare.length})
                    </button>
                    <button
                        onClick={onClearComparison}
                        className="font-bold py-1 sm:py-2 px-3 sm:px-6 rounded-xl shadow-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-300 text-sm sm:text-base"
                        aria-label="Clear all selections"
                    >
                        Clear All
                    </button>
                </div>
            )}
        </div>
    );
});

// PolicyDetailPanel Component - Displays policy details in a side panel
const PolicyDetailPanel = ({ policy, onClose }) => {
  if (!policy) return null;
  
  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-1/4 bg-white shadow-xl z-30 flex flex-col rounded-l-xl sm:rounded-l-xl border-l border-gray-200">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">Policy Details</h3>
        <button 
          onClick={onClose}
          className="p-1 text-gray-600 hover:bg-gray-200 rounded-full transition-colors duration-200"
          aria-label="Close policy details"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div className="flex-grow overflow-y-auto p-4">
        <h2 className="text-xl font-bold text-gray-800 mb-2">{policy.name}</h2>
        <p className="text-gray-600 text-sm mb-4">{policy.company}</p>
        <p className="text-gray-700 mb-4 italic">{policy.shortDescription}</p>
        
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Must Have Features
          </h3>
          <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
            {policy.mustHave.map((benefit, index) => (
              <li key={index} className="text-sm">{benefit}</li>
            ))}
          </ul>
        </div>
        
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Good To Have
          </h3>
          <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
            {policy.goodToHave.map((exclusion, index) => (
              <li key={index} className="text-sm">{exclusion}</li>
            ))}
          </ul>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Add On          
            </h3>
          <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
            {policy.addOns.map((criterion, index) => (
              <li key={index} className="text-sm">{criterion}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

// PolicyFeaturesPanel Component - Displays policy features in a side panel
const PolicyFeaturesPanel = ({ 
  featureCategory, 
  onClose, 
  onBackToCategories,
  onFeatureClick,
  categoryName,
  selectedPolicyType,  // Add selectedPolicyType prop
  policiesData  // Add policiesData prop
}) => {
  if (!featureCategory) return null;
  
  // Define the policy features categories and their details
  const policyFeatures = [
    {
      id: 'must',
      title: 'Must To Have',
      description: 'Essential features that form the foundation of any good insurance policy',
      features: [
         'Claim Settlement Ratio',
         'Hospital Network',
         'Room Rent',
         'Copayment',
         'Restoration Benefit',
         'Post Hospitalisation Coverage',
      ]
    },
    {
      id: 'good',
      title: 'Good To Have',
      description: 'Valuable additions that significantly enhance your coverage experience',
      features: [
        'Waiting Period',
        'No Claim Bonus',
        'Disease Sub limits',
        'Alternate Treatment Coverage',
        'Maternity Care',
        'Newborn Care',
        'Health Checkups',
      ]
    },
    {
      id: 'very',
      title: 'Add On',
      description: 'Premium features that provide maximum protection and convenience',
      features: [
      'Domiciliary',
      'Outpatient Department',
      'Lifelong Renewal',
      'Critical Illness Rider',
      'Accident & Disability Rider',
      ]
    }
  ];
  
  const selectedFeature = policyFeatures.find(f => f.id === featureCategory);
  
  if (!selectedFeature) return null;
  
  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-1/4 bg-white shadow-xl z-50 flex flex-col rounded-l-xl sm:rounded-l-xl border-l border-gray-200">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <div className="flex items-center">
          <button 
            onClick={onBackToCategories}
            className="flex items-center text-cyan-600 hover:text-cyan-800 mr-3"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7 7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="ml-1 text-sm font-medium">Back</span>
          </button>
          <h3 className="text-lg font-semibold text-gray-800">{categoryName || selectedFeature.title}</h3>
        </div>
        <button 
          onClick={onClose}
          className="p-1 text-gray-600 hover:bg-gray-200 rounded-full transition-colors duration-200"
          aria-label="Close policy features"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div className="flex-grow overflow-y-auto p-4">
        <h2 className="text-xl font-bold text-cyan-600 mb-2">{selectedFeature.title}</h2>
        <p className="text-gray-600 text-sm mb-4">{selectedFeature.description}</p>
        
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Key Features</h3>
          <ul className="space-y-3 ml-2">
            {selectedFeature.features.map((feature, index) => (
              <li key={index}>
                <button
                  onClick={() => {
                    onFeatureClick(feature);
                    onClose();
                  }}
                  className="w-full text-left p-3 bg-cyan-50 hover:bg-cyan-100 rounded-lg transition-colors duration-200 flex items-center justify-between group"
                >
                  <span className="text-gray-700 group-hover:text-cyan-700">{feature}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-cyan-500 opacity-0 group-hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7-7m7 7H3" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="mt-6 p-4 bg-cyan-50 rounded-lg">
          <p className="text-sm text-cyan-700 font-medium mb-2">Tip:</p>
          <p className="text-xs text-gray-600">Click on any feature to learn more about it in the chat. Our advisor will provide detailed information tailored to your needs.</p>
        </div>
      </div>
    </div>
  );
};

// MenuSidePanel Component - Mobile responsive adjustments
const MenuSidePanel = ({ 
  isOpen, 
  onClose,
  selectedPolicyType,
  setSelectedPolicyType,
  selectedBudget,
  setSelectedBudget,
  policiesToCompare,
  onCompareClick,
  onClearComparison,
  onGetAdvice,
  onUploadDocument,
  comparisonFeedback,
  onChatWithPolicies,
  policyForAdvice,
  setShowMenuSidePanel,
  policiesData,  // Add policiesData prop
  onShowComparePaymentModal // New prop for showing compare payment modal
}) => {
  const [showPlans, setShowPlans] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const policyListingRef = useRef(null);
  const panelContentRef = useRef(null);
  const originalSectionRef = useRef(null);
  
  // Filter policies based on the selected type
  const filteredPolicies = policiesData.filter(policy => policy.type === selectedPolicyType);
  
  // Sort policies by rating (highest first)
  const sortedPolicies = [...filteredPolicies].sort((a, b) => b.rating - a.rating);
  
  // Calculate dynamic values from selectedBudget
  const ensureAmount = selectedBudget ? (parseInt(selectedBudget) * 100).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }) : '5,00,000';
  const monthlyPremium = selectedBudget ? (parseInt(selectedBudget) / 12).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }) : '417';
  const totalCoverAmount = selectedBudget ? (parseInt(selectedBudget) * 1000).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }) : '50,00,000';
  
  // Handle Get Plans click
  const handleGetPlansClick = () => {
    if (selectedPolicyType) {
      setShowPlans(true);
      // Scroll to policy listing after it renders
      setTimeout(() => {
        if (policyListingRef.current) {
          policyListingRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  };
  
  // MODIFIED: Handle policy type change from floating buttons
  const handlePolicyTypeChange = (type) => {
    setSelectedPolicyType(type);
    // Hide the plans view and scroll back to the top to show the policy selection section
    setShowPlans(false);
    // Scroll to top of panel
    if (panelContentRef.current) {
      panelContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  
  // Handle scroll to detect if user has scrolled past the original section
  useEffect(() => {
    const handleScroll = () => {
      if (panelContentRef.current && originalSectionRef.current && showPlans) {
        const panelRect = panelContentRef.current.getBoundingClientRect();
        const sectionRect = originalSectionRef.current.getBoundingClientRect();
        
        // Check if the original section is out of view (scrolled up)
        setIsScrolled(sectionRect.bottom < panelRect.top);
      }
    };
    
    const panelContent = panelContentRef.current;
    if (panelContent) {
      panelContent.addEventListener('scroll', handleScroll);
      // Initial check
      handleScroll();
    }
    
    return () => {
      if (panelContent) {
        panelContent.removeEventListener('scroll', handleScroll);
      }
    };
  }, [showPlans]);
  
  return (
    <div className={`fixed inset-y-0 right-0 w-full sm:w-1/2 bg-white shadow-xl z-40 flex flex-col rounded-l-xl sm:rounded-l-xl border-l border-gray-200 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      {/* Panel Header */}
      <div className="p-3 sm:p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Policy Selection</h2>
        <button 
          onClick={onClose}
          className="p-1 text-gray-600 hover:bg-gray-200 rounded-full transition-colors duration-200"
          aria-label="Close panel"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {/* Panel Content - Scrollable */}
      <div ref={panelContentRef} className="flex-grow overflow-y-auto">
        {/* Floating Policy Type Buttons - Only show when plans are displayed */}
        {showPlans && (
          <div className={`sticky top-0 z-10 bg-white p-2 sm:p-3 border-b border-gray-200 shadow-sm transition-all duration-300 ${isScrolled ? 'py-1' : 'py-2 sm:py-3'}`}>
            <div className="flex justify-center space-x-1 sm:space-x-2">
              {['Health', 'Term', 'Motor'].map((type) => (
                <button
                  key={type}
                  onClick={() => handlePolicyTypeChange(type)}
                  className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium transition-all duration-300
                    ${selectedPolicyType === type
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    } ${isScrolled ? 'text-[10px] px-1 sm:px-2 py-0.5' : ''}`}
                  aria-label={`Select ${type} insurance`}
                  aria-pressed={selectedPolicyType === type}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Policy Type Selection - Original section */}
        <div ref={originalSectionRef} className="p-3 sm:p-4 border-b border-gray-200">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 sm:mb-3">Select Policy Type</h3>
          <div className="grid grid-cols-3 gap-1 sm:gap-2">
            {['Health', 'Term', 'Motor'].map((type) => (
              <button
                key={type}
                onClick={() => {
                  setSelectedPolicyType(type);
                  setShowPlans(false); // Reset plans view when type changes
                }}
                className={`flex flex-col items-center p-2 sm:p-3 rounded-xl shadow-md transition duration-300 ease-in-out transform hover:-translate-y-1 focus:outline-none focus:ring-2
                  ${selectedPolicyType === type
                    ? 'bg-yellow-400 border-yellow-500 text-yellow-900 shadow-lg ring-yellow-300'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-800 focus:ring-cyan-400'
                  }`}
                aria-label={`Select ${type} insurance`}
                aria-pressed={selectedPolicyType === type}
              >
                {type === 'Health' && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-cyan-600 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                )}
                {type === 'Term' && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2-1.343-2-3-2zM12 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2zM12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
                {type === 'Motor' && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                )}
                <span className="text-xs sm:text-sm font-semibold text-gray-800">{type}</span>
              </button>
            ))}
          </div>
        </div>
        
        {/* Budget Selection */}
        <div className="p-3 sm:p-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 sm:mb-3">Select Budget</h3>
          <div className="max-w-lg mx-auto">
            <p className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4">{parseInt(selectedBudget).toLocaleString('en-IN')}</p>
            <input
              type="range"
              min="5000"
              max="50000"
              step="5000"
              value={selectedBudget}
              onChange={(e) => setSelectedBudget(e.target.value)}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-cyan-400"
              style={{ '--thumb-color': '#06b6d4' }}
              aria-label="Select budget amount"
            />
            <div className="flex justify-between text-xs sm:text-sm text-gray-600 mt-2">
              <span>5,000</span>
              <span>50,000</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-6 sm:mt-8 text-gray-800">
              <div className="p-2 sm:p-3 bg-white rounded-xl shadow-sm border border-gray-200">
                <p className="font-semibold text-xs sm:text-sm">Ensure</p>
                <p className="text-base sm:text-lg font-bold text-cyan-600">{ensureAmount}</p>
              </div>
              <div className="p-2 sm:p-3 bg-white rounded-xl shadow-sm border border-gray-200">
                <p className="font-semibold text-xs sm:text-sm">Monthly</p>
                <p className="text-base sm:text-lg font-bold text-cyan-600">{monthlyPremium}</p>
              </div>
              <div className="p-2 sm:p-3 bg-white rounded-xl shadow-sm border border-gray-200">
                <p className="font-semibold text-xs sm:text-sm">Total Cover</p>
                <p className="text-base sm:text-lg font-bold text-cyan-600">{totalCoverAmount}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Get Plans Button */}
        <div className="p-3 sm:p-4 border-b border-gray-200 flex justify-center">
          <button
            onClick={handleGetPlansClick}
            disabled={!selectedPolicyType}
            className={`font-medium py-2 px-4 sm:px-6 rounded-lg shadow transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 text-sm sm:text-base
              ${selectedPolicyType ? 'bg-cyan-600 hover:bg-cyan-700 text-white focus:ring-cyan-300' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
            aria-label="Get insurance plans"
          >
            Get Plans
          </button>
        </div>
        
        {/* Policy Listing - Conditionally shown */}
        {showPlans && selectedPolicyType && (
          <div ref={policyListingRef} className="p-3 sm:p-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">
              {selectedPolicyType} Plans
            </h3>
            
            {comparisonFeedback && (
              <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-cyan-100 text-cyan-800 rounded-lg text-center font-medium flex flex-col sm:flex-row justify-between items-center">
                <span className="text-sm sm:text-base">{comparisonFeedback}</span>
                {policiesToCompare.length > 0 && (
                  <button
                    onClick={onClearComparison}
                    className="mt-2 sm:mt-0 sm:ml-4 px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300 transition-colors duration-200"
                    aria-label="Clear all selections"
                  >
                    Clear All
                  </button>
                )}
              </div>
            )}
            
            <div className="space-y-3 sm:space-y-4">
              {sortedPolicies.map((policy) => (
                <PolicyCard
                  key={policy.id}
                  policy={policy}
                  onGetAdvice={(policy) => {
                    // Set the policy for advice highlighting
                    onGetAdvice(policy);
                    // Close the side panel immediately
                    onClose();
                  }}
                  onCompareClick={onCompareClick}
                  isSelectedForComparison={policiesToCompare.some(p => p.id === policy.id)}
                  disableCompareButton={policiesToCompare.length >= 5 && !policiesToCompare.some(p => p.id === policy.id)} // Updated to 5
                  isPolicyForAdvice={policyForAdvice && policy.id === policyForAdvice.id}
                />
              ))}
            </div>
            
            {/* Upload Document Button */}
            <div className="mt-4 sm:mt-6 text-center">
              
            </div>
          </div>
        )}
      </div>
      
      {/* Floating comparison bar */}
      {policiesToCompare.length > 0 && (
  <div className="fixed bottom-2 sm:bottom-6 left-1/2 transform -translate-x-1/2 bg-white p-2 sm:p-4 shadow-lg border border-gray-200 rounded-xl flex justify-center items-center space-x-2 sm:space-x-4 z-30 w-11/12 sm:w-auto">
    <button
      onClick={() => {
        // Close the side panel
        onClose();
        // Show the compare payment modal
        onShowComparePaymentModal();
      }}
      disabled={policiesToCompare.length < 1}
      className={`font-medium py-1 sm:py-2 px-3 sm:px-5 rounded-lg shadow transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 text-xs sm:text-sm
        ${policiesToCompare.length >= 1 ? 'bg-purple-500 hover:bg-purple-600 text-white focus:ring-purple-300 shadow-xl' : 
          'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
      aria-label={`Compare ${policiesToCompare.length} policies`}
    >
      Compare ({policiesToCompare.length})
    </button>
    <button
      onClick={onClearComparison}
      className="font-medium py-1 sm:py-1.5 px-2 sm:px-4 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-300 text-xs"
      aria-label="Clear all selections"
    >
      Clear All
    </button>
  </div>
)}
    </div>
  );
};

// PolicyComparisonSidePanel Component - Modified for split-screen view
const PolicyComparisonSidePanel = ({ 
  policies, 
  onClose, 
  onSendMessage,
  isSplitView = false,
  onFeatureClick
}) => {
  if (!policies || policies.length === 0) return null;
  
  const policiesToDisplay = policies.slice(0, 5); // Updated to 5
  
  // Calculate column widths dynamically based on number of policies
  const getColumnWidths = () => {
    switch(policiesToDisplay.length) {
      case 1:
        // For 1 policy: 50% features, 50% policy
        return { feature: 'w-1/2', policy: 'w-1/2' };
      case 2:
        // For 2 policies: 50% features, 25% each policy
        return { feature: 'w-1/3', policy: 'w-1/4' };
      case 3:
        // For 3 policies: 40% features, 20% each policy
        return { feature: 'w-2/5', policy: 'w-1/5' };
      case 4:
        // For 4 policies: 33% features, 16.5% each policy
        return { feature: 'w-1/3', policy: 'w-1/6' };
      case 5:
        // For 5 policies: 33% features, 13.4% each policy
        return { feature: 'w-1/3', policy: 'w-1/7' };
      default:
        return { feature: 'w-1/2', policy: 'w-1/3' };
    }
  };
  
  const columnWidths = getColumnWidths();
  
  // Function to render a row for a common feature
  const renderFeatureRow = (featureName, renderValue) => (
    <tr className="border-t border-gray-200">
      <td className={`py-2 sm:py-3 px-2 sm:px-4 text-gray-700 text-xs sm:text-sm sticky left-0 bg-white z-[2] ${columnWidths.feature}`}>
        <button
          onClick={() => onFeatureClick(featureName)}
          className="inline-block px-3 py-1 rounded-full hover:bg-cyan-100 hover:text-cyan-700 transition-all duration-200 group"
        >
          <span className="group-hover:font-medium">{featureName}</span>
        </button>
      </td>
      {policiesToDisplay.map((policy, index) => (
        <td key={policy.id} className={`py-2 sm:py-3 px-2 sm:px-4 border-l border-gray-200 text-center text-xs sm:text-sm ${columnWidths.policy}`}>
          {renderValue(policy, index)}
        </td>
      ))}
    </tr>
  );
  
  // Function to render a row for a list feature with cyan headings
  const renderListFeatureRow = (featureName, allItems, itemProperty) => (
    <>
      <tr className="border-t border-gray-300">
        <td colSpan={policiesToDisplay.length + 1} 
            className={`py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm sticky left-0 bg-white z-[2] ${columnWidths.feature}
                        ${featureName === "Must Have" || featureName === "Good To Have" || featureName === "Add On" 
                          ? 'text-cyan-600 font-bold' 
                          : 'text-gray-700'}`}>
          <button
            onClick={() => onFeatureClick(featureName)}
            className="inline-block px-3 py-1 rounded-full hover:bg-cyan-100 hover:text-cyan-700 transition-all duration-200 group"
          >
            <span className="group-hover:font-medium">{featureName}</span>
          </button>
        </td>
      </tr>
      {allItems.map((item, itemIndex) => {
        // Extract just the feature name (before the colon) for the first column
        const featureNameOnly = item.includes(':') ? item.substring(0, item.indexOf(':')).trim() : item;

        return (
          <tr key={`${featureName.toLowerCase()}-${itemIndex}`} className="border-t border-gray-200">
            <td className={`py-2 sm:py-3 px-2 sm:px-4 text-gray-700 text-xs sm:text-sm sticky left-0 bg-white z-[2] ${columnWidths.feature}`}>
              <button
                onClick={() => onFeatureClick(featureNameOnly)}
                className="inline-block px-3 py-1 rounded-full hover:bg-cyan-100 hover:text-cyan-700 transition-all duration-200 group"
              >
                <span className="group-hover:font-medium">{featureNameOnly}</span>
              </button>
            </td>
            {policiesToDisplay.map(policy => {
              // Support both old and new property naming
              const propertyMap = {
                'mustHave': 'benefits',
                'goodToHave': 'exclusions',
                'addOns': 'eligibility'
              };
              const items = policy[itemProperty] || policy[propertyMap[itemProperty]] || [];

              // Find the matching item and extract its value
              const matchingItem = items.find(i => i.startsWith(item + ':') || i === item);
              let displayValue = '-';

              if (matchingItem) {
                // Extract value after the colon if it exists (e.g., "Room Rent: Single AC Room")
                const colonIndex = matchingItem.indexOf(':');
                if (colonIndex !== -1) {
                  displayValue = matchingItem.substring(colonIndex + 1).trim();
                } else {
                  displayValue = '✓'; // Show tick mark if no value (just feature name)
                }
              }

              return (
                <td key={policy.id} className={`py-2 sm:py-3 px-2 sm:px-4 border-l border-gray-200 text-xs sm:text-sm ${columnWidths.policy}`}>
                  <div className={displayValue === '-' ? 'text-gray-400 text-center' : 'text-gray-700'}>
                    {displayValue}
                  </div>
                </td>
              );
            })}
          </tr>
        );
      })}
    </>
  );
  
  // Collect all unique must-have, good-to-have, and add-ons
  // Support both old naming (mustHave/goodToHave/addOns) and new naming (benefits/exclusions/eligibility)
  const allMustHave = [...new Set(policiesToDisplay.flatMap(p => p.mustHave || p.benefits || []))].sort();
  const allGoodToHave = [...new Set(policiesToDisplay.flatMap(p => p.goodToHave || p.exclusions || []))].sort();
  const allAddOns = [...new Set(policiesToDisplay.flatMap(p => p.addOns || p.eligibility || []))].sort();
  
  // For split view, we don't want fixed positioning
  if (isSplitView) {
    return (
      <div className="h-full w-full bg-white shadow-xl z-40 flex flex-col border-l border-gray-200">
        <div className="p-3 sm:p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800">Policy Comparison</h3>
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            className="p-1 text-gray-600 hover:bg-gray-200 rounded-full transition-colors duration-200"
            aria-label="Close comparison"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="flex-grow overflow-x-auto pt-0 px-2 sm:px-4 pb-4">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-cyan-600 text-white text-left text-xs sm:text-sm uppercase tracking-wider sticky top-0 z-10">
                <th className={`py-2 sm:py-3 px-2 sm:px-4 rounded-tl-xl ${columnWidths.feature} sticky left-0 bg-cyan-600 z-[3]`}>Feature</th>
                {policiesToDisplay.map((policy, index) => (
                  <th key={policy.id} className={`py-2 sm:py-3 px-2 sm:px-4 border-l border-cyan-500 ${columnWidths.policy}`}>
                    <div className="flex flex-col items-center">
                      <span className="inline-block w-5 h-5 sm:w-6 sm:h-6 bg-white text-cyan-600 text-xs font-bold rounded-full text-center leading-5 sm:leading-6 mb-1">
                        {index + 1}
                      </span>
                      <div className="text-center">
                        <div className="font-bold text-xs sm:text-sm">{policy.name}</div>
                        <div className="text-xs opacity-90">({policy.company})</div>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {renderFeatureRow("Type", (policy) => policy.type)}
              {renderFeatureRow("Short Description", (policy) => <span className="text-xs">{policy.shortDescription}</span>)}
              {renderFeatureRow("Price Range", (policy) => policy.priceRange)}
              {renderFeatureRow("Rating", (policy) => `${policy.rating} ★`)}
              {renderFeatureRow("Reviews", (policy) => policy.reviewsCount.toLocaleString())}
              {renderListFeatureRow("Must Have", allMustHave, "mustHave")}
              {renderListFeatureRow("Good To Have", allGoodToHave, "goodToHave")}
              {renderListFeatureRow("Add On", allAddOns, "addOns")}
            </tbody>
          </table>
        </div>
        
        <div className="p-3 sm:p-4 border-t border-gray-200 flex justify-center">
          {/* Add any action buttons here if needed */}
        </div>
      </div>
    );
  }
  
  // For mobile view (original behavior)
  return (
    <div className="fixed top-14 sm:top-14 right-0 bottom-0 w-full sm:w-3/4 bg-white shadow-xl z-40 flex flex-col rounded-l-xl sm:rounded-l-xl border-l border-gray-200">
      <div className="p-3 sm:p-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-base sm:text-lg font-semibold text-gray-800">Policy Comparison</h3>
        <button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }}
          className="p-1 text-gray-600 hover:bg-gray-200 rounded-full transition-colors duration-200"
          aria-label="Close comparison"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div className="flex-grow overflow-x-auto pt-0 px-2 sm:px-4 pb-4">
        <table className="min-w-full bg-white">
          <thead>
            <tr className="bg-cyan-600 text-white text-left text-xs sm:text-sm uppercase tracking-wider sticky top-0 z-10">
              <th className={`py-2 sm:py-3 px-2 sm:px-4 rounded-tl-xl ${columnWidths.feature} sticky left-0 bg-cyan-600 z-[3]`}>Feature</th>
              {policiesToDisplay.map((policy, index) => (
                <th key={policy.id} className={`py-2 sm:py-3 px-2 sm:px-4 border-l border-cyan-500 ${columnWidths.policy}`}>
                  <div className="flex flex-col items-center">
                    <span className="inline-block w-5 h-5 sm:w-6 sm:h-6 bg-white text-cyan-600 text-xs font-bold rounded-full text-center leading-5 sm:leading-6 mb-1">
                      {index + 1}
                    </span>
                    <div className="text-center">
                      <div className="font-bold text-xs sm:text-sm">{policy.name}</div>
                      <div className="text-xs opacity-90">({policy.company})</div>
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {renderFeatureRow("Type", (policy) => policy.type)}
            {renderFeatureRow("Short Description", (policy) => <span className="text-xs">{policy.shortDescription}</span>)}
            {renderFeatureRow("Price Range", (policy) => policy.priceRange)}
            {renderFeatureRow("Rating", (policy) => `${policy.rating} ★`)}
            {renderFeatureRow("Reviews", (policy) => policy.reviewsCount.toLocaleString())}
            {renderListFeatureRow("Must Have", allMustHave, "mustHave")}
            {renderListFeatureRow("Good To Have", allGoodToHave, "goodToHave")}
            {renderListFeatureRow("Add On", allAddOns, "addOns")}
          </tbody>
        </table>
      </div>
      
      <div className="p-3 sm:p-4 border-t border-gray-200 flex justify-center">
        {/* Add any action buttons here if needed */}
      </div>
    </div>
  );
};

// UploadDocumentScreen Component - New screen for uploading policy documents
const UploadDocumentScreen = ({ onBack, onDocumentUpload }) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadMessage, setUploadMessage] = useState('');
    
    const handleFileChange = (event) => {
        if (event.target.files && event.target.files[0]) {
            setSelectedFile(event.target.files[0]);
            setUploadMessage('');
        }
    };
    
    const handleUpload = () => {
        if (!selectedFile) {
            setUploadMessage('Please select a file to upload.');
            return;
        }
        setUploading(true);
        setUploadMessage('Uploading...');
        // Simulate file upload (e.g., to a server)
        setTimeout(() => {
            setUploading(false);
            setUploadMessage(`"${selectedFile.name}" uploaded successfully! Analyzing document...`);
            // In a real app, you would send the file to a backend for processing
            // For now, we simulate success and then call a callback
            setTimeout(() => {
                onDocumentUpload(selectedFile.name); // Callback to parent
            }, 2000);
        }, 3000);
    };
    
    return (
        <ScreenWrapper isCentered={true} maxWidthClass="max-w-xl">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-gray-800 mb-6 text-center">
                Upload Policy Document
            </h1>
            <p className="text-base sm:text-lg text-gray-600 mb-8 text-center">
                Upload your existing policy document (PDF, DOCX) to get a tailored recommendation.
            </p>
            <div className="flex flex-col items-center justify-center p-6 bg-gray-50 border border-gray-200 rounded-xl shadow-inner w-full max-w-md">
                <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500
                               file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0
                               file:text-sm file:font-semibold
                               file:bg-cyan-600 file:text-white
                               hover:file:bg-cyan-700 mb-4"
                    aria-label="Upload policy document"
                />
                {selectedFile && (
                    <p className="text-gray-700 text-sm mb-4 text-center">Selected file: <span className="font-medium">{selectedFile.name}</span></p>
                )}
                {uploadMessage && (
                    <p className={`text-sm mb-4 ${uploadMessage.includes('successfully') ? 'text-green-600' : 'text-red-600'}`}>
                        {uploadMessage}
                    </p>
                )}
                <button
                    onClick={handleUpload}
                    disabled={!selectedFile || uploading}
                    className={`font-bold py-3 px-8 rounded-xl shadow-lg transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4
                        ${selectedFile && !uploading ? 'bg-cyan-600 hover:bg-cyan-700 text-white focus:ring-cyan-300' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                    aria-label="Analyze document"
                >
                    {uploading ? 'Processing...' : 'Analyze Document'}
                </button>
            </div>
            <button
                onClick={onBack}
                className="mt-8 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors duration-200 text-sm font-medium"
                aria-label="Back to plans"
            >
                Back to Plans
            </button>
        </ScreenWrapper>
    );
};

// PolicyDetailScreen Component - Displays specific details about a selected policy
const PolicyDetailScreen = ({ policy, onBack, onTalkToAdvisor, comparisonFeedback, policiesToCompareCount }) => {
  // Move the useEffect outside of the conditional return
  useEffect(() => {
    // Scroll to the top when this component mounts (i.e., new screen navigation)
    window.scrollTo(0, 0);
  }, []);
  
  if (!policy) {
    return (
        <div className="flex flex-col h-full bg-gray-50 w-full max-w-3xl mx-auto rounded-xl shadow-lg border border-gray-200">
            <div className="flex-grow p-6 overflow-y-auto">
                <h1 className="text-3xl sm:text-4xl font-semibold text-gray-800 mb-6 text-center">Policy Not Found</h1>
                <p className="text-center text-gray-600">The policy you are looking for does not exist.</p>
            </div>
        </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full bg-gray-50 w-full max-w-4xl mx-auto rounded-xl shadow-lg border border-gray-200 overflow-y-auto">
      <div className="flex-grow p-6 sm:p-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-gray-800 mb-6 text-center">Policy Details</h1>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-700 mb-4 text-center">{policy.name} ({policy.company})</h2>
        <p className="text-gray-600 text-center mb-6 italic">{policy.shortDescription}</p>
        
        {/* Policy rating and price information */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-8 mb-8">
          <div className="flex flex-col items-center bg-white p-4 rounded-xl shadow-md border border-gray-200">
            <span className="text-sm text-gray-600 mb-1">Rating</span>
            <div className="flex items-center">
              <span className="text-xl font-bold text-yellow-500 mr-1">{'★'.repeat(Math.floor(policy.rating))}</span>
              {policy.rating % 1 !== 0 && <span className="text-xl font-bold text-yellow-500">★</span>}
              <span className="text-lg font-semibold text-gray-700 ml-1">{policy.rating}</span>
            </div>
            <span className="text-xs text-gray-500 mt-1">({policy.reviewsCount} reviews)</span>
          </div>
          
          <div className="flex flex-col items-center bg-white p-4 rounded-xl shadow-md border border-gray-200">
            <span className="text-sm text-gray-600 mb-1">Price Range</span>
            <span className="text-xl font-bold text-cyan-600">{policy.priceRange}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-5 rounded-xl shadow-md border border-gray-200">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-cyan-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Must Have Features
            </h3>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              {policy.mustHave.map((benefit, index) => (
                <li key={index}>{benefit}</li>
              ))}
            </ul>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-md border border-gray-200">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Good To Have Features
            </h3>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              {policy.goodToHave.map((exclusion, index) => (
                <li key={index}>{exclusion}</li>
              ))}
            </ul>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-md border border-gray-200 mb-8">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            Add On
          </h3>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              {policy.addOns.map((criterion, index) => (
                <li key={index}>{criterion}</li>
              ))}
            </ul>
          </div>
        
        {/* Additional policy information section */}
        <div className="bg-white p-5 rounded-xl shadow-md border border-gray-200 mb-8">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Why Choose This Policy
          </h3>
          <p className="text-gray-600">
            This {policy.type.toLowerCase()} insurance policy from {policy.company} offers comprehensive coverage with excellent customer satisfaction. 
            With a rating of {policy.rating} out of 5 from {policy.reviewsCount.toLocaleString()} reviews, it's a trusted choice among customers looking for reliable protection.
          </p>
        </div>
        
        {comparisonFeedback && (
            <p className="text-center text-sm mt-4 p-2 bg-yellow-100 text-yellow-800 rounded-md">
                {comparisonFeedback}
            </p>
        )}
        {/* Call to Action Buttons */}
        <div className="text-center mt-8 space-y-4 flex flex-col sm:flex-row justify-center sm:space-y-0 sm:space-x-4">
            {/* Removed Back to List button */}
            {/* Removed Compare button */}
            <button
                onClick={() => onTalkToAdvisor(policy)}
                className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-cyan-300"
                aria-label="Get unbiased advice"
            >
                Get Unbiased Advice
            </button>
        </div>
      </div>
    </div>
  );
};

// PaymentScreen Component - New screen for payment processing
const PaymentScreen = ({ 
  policiesToCompare, 
  onBack, 
  onPaymentSuccess, 
  onCancel 
}) => {
  const [paymentMethod, setPaymentMethod] = useState('credit-card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [upiId, setUpiId] = useState('');
  const [netBanking, setNetBanking] = useState('');
  
  // Calculate pricing based on number of policies
  const policyCount = policiesToCompare.length;
  const pricingInfo = PAYMENT_PRICING[policyCount] || PAYMENT_PRICING[5];
  
  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    setIsProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      onPaymentSuccess();
    }, 2000);
  };
  
  return (
    <div className="flex flex-col h-full bg-gray-50 w-full max-w-4xl mx-auto rounded-xl shadow-lg border border-gray-200 overflow-y-auto">
      <div className="p-4 sm:p-6 border-b border-gray-200 flex items-center">
        <button 
          onClick={onBack}
          className="p-2 mr-4 text-gray-600 hover:bg-gray-200 rounded-full transition-colors duration-200"
          aria-label="Go back"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800">Payment</h1>
      </div>
      
      <div className="flex-grow p-4 sm:p-6">
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Order Summary</h2>
          
          <div className="space-y-4 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Selected Policies:</span>
              <span className="font-medium">{policyCount}</span>
            </div>
            
            <div className="space-y-2">
              {policiesToCompare.map((policy, index) => (
                <div key={policy.id} className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">{index + 1}. {policy.name}</span>
                  <span className="text-cyan-600 font-medium">{policy.company}</span>
                </div>
              ))}
            </div>
            
            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <span className="text-gray-600">Plan:</span>
              <span className="font-medium">{pricingInfo.description}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">Total Amount:</span>
              <span className="text-xl font-bold text-cyan-600">
                {pricingInfo.price === 0 ? 'FREE' : `₹${pricingInfo.price}`}
              </span>
            </div>
          </div>
          
          <div className="bg-cyan-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-cyan-800 mb-2">What you'll get:</h3>
            <ul className="text-sm text-cyan-700 space-y-1">
              <li className="flex items-start">
                <svg className="w-4 h-4 mr-2 mt-0.5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Detailed comparison of selected policies
              </li>
              <li className="flex items-start">
                <svg className="w-4 h-4 mr-2 mt-0.5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Personalized recommendations based on your needs
              </li>
              <li className="flex items-start">
                <svg className="w-4 h-4 mr-2 mt-0.5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Access to exclusive policy insights
              </li>
              <li className="flex items-start">
                <svg className="w-4 h-4 mr-2 mt-0.5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Ongoing support from our policy advisors
              </li>
            </ul>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-6">
            <div className="px-3 py-1 bg-cyan-100 text-cyan-800 rounded-full text-xs font-medium">
              Secure Payment
            </div>
            <div className="px-3 py-1 bg-cyan-100 text-cyan-800 rounded-full text-xs font-medium">
              Instant Access
            </div>
            <div className="px-3 py-1 bg-cyan-100 text-cyan-800 rounded-full text-xs font-medium">
              Money Back Guarantee
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Payment Method</h2>
          
          <div className="flex flex-wrap gap-3 mb-6">
            <button
              onClick={() => setPaymentMethod('credit-card')}
              className={`px-4 py-2 rounded-lg border transition-colors duration-200 ${
                paymentMethod === 'credit-card'
                  ? 'bg-cyan-600 text-white border-cyan-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Credit/Debit Card
            </button>
            <button
              onClick={() => setPaymentMethod('upi')}
              className={`px-4 py-2 rounded-lg border transition-colors duration-200 ${
                paymentMethod === 'upi'
                  ? 'bg-cyan-600 text-white border-cyan-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              UPI
            </button>
            <button
              onClick={() => setPaymentMethod('net-banking')}
              className={`px-4 py-2 rounded-lg border transition-colors duration-200 ${
                paymentMethod === 'net-banking'
                  ? 'bg-cyan-600 text-white border-cyan-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Net Banking
            </button>
          </div>
          
          <form onSubmit={handlePaymentSubmit}>
            {paymentMethod === 'credit-card' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="1234 5678 9012 3456"
                    className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name on Card</label>
                  <input
                    type="text"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                    <input
                      type="text"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      placeholder="MM/YY"
                      className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                    <input
                      type="text"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value)}
                      placeholder="123"
                      className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                      required
                    />
                  </div>
                </div>
              </div>
            )}
            
            {paymentMethod === 'upi' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">UPI ID</label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="yourname@upi"
                  className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  required
                />
              </div>
            )}
            
            {paymentMethod === 'net-banking' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Bank</label>
                <select
                  value={netBanking}
                  onChange={(e) => setNetBanking(e.target.value)}
                  className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  required
                >
                  <option value="">Select your bank</option>
                  <option value="sbi">State Bank of India</option>
                  <option value="hdfc">HDFC Bank</option>
                  <option value="icici">ICICI Bank</option>
                  <option value="axis">Axis Bank</option>
                  <option value="kotak">Kotak Mahindra Bank</option>
                </select>
              </div>
            )}
            
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                disabled={isProcessing}
                className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors duration-200 ${
                  isProcessing
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-cyan-600 text-white hover:bg-cyan-700'
                }`}
              >
                {isProcessing ? 'Processing...' : `Pay ${pricingInfo.price === 0 ? 'FREE' : `₹${pricingInfo.price}`}`}
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="py-3 px-6 rounded-lg font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Payment Modal for Compare Button
const PaymentModalForCompare = ({ 
  onCancel, 
  onOptionSelected,
  policiesToCompare
}) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Blurred background */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onCancel}
      ></div>
      
      {/* Modal content */}
      <div className="relative bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4 z-10">
        {/* Close button */}
        <button 
          onClick={onCancel}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        {/* Modal header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Ready to get started?</h2>
          <p className="text-gray-600">
            Organize your inbox with the click of a button
          </p>
        </div>
        
        {/* Payment options */}
        <div className="space-y-4 mb-8">
          {/* Free Plan */}
          <div className="border border-gray-200 rounded-lg p-4 hover:border-cyan-300 transition-colors">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-lg">Starter Plan</h3>
              <span className="text-cyan-600 font-bold">Free</span>
            </div>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Delete up to 2000 emails
              </li>
              <li className="flex items-center">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Basic AI categorization
              </li>
            </ul>
            <button 
              onClick={() => onOptionSelected('free')}
              className="w-full mt-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Current Plan
            </button>
          </div>
          
          {/* Subscription Plan */}
          <div className="border-2 border-cyan-500 rounded-lg p-4 relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-cyan-500 text-white text-xs px-3 py-1 rounded-full">
              POPULAR
            </div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-lg">Subscription Plan</h3>
              <span className="text-cyan-600 font-bold">299/year</span>
            </div>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Unlimited deletions
              </li>
              <li className="flex items-center">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Advanced AI filtering
              </li>
              <li className="flex items-center">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Priority support
              </li>
              <li className="flex items-center">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Monthly updates
              </li>
            </ul>
            <button 
              onClick={() => onOptionSelected('subscription')}
              className="w-full mt-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
            >
              Subscribe
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// PolicyAdvisorChat Component - Modified for split-screen view
const PolicyAdvisorChat = ({ 
  messages, 
  onSendMessage, 
  initialBotMessageText, 
  onMenuClick,
  selectedPolicyType,
  setSelectedPolicyType,
  selectedBudget,
  setSelectedBudget,
  policiesToCompare,
  onClearComparison,
  onInitiateSelectedComparison,
  onCompareClick,
  initialPolicyForChat,
  onPolicyNameClick,
  onBackToHome,
  onGetAdvice,
  onUploadDocument,
  comparisonFeedback,
  showMenuSidePanel,
  setShowMenuSidePanel,
  onPaymentScreenClick,
  showSingleComparison,
  setShowSingleComparison,
  onFeatureClick,
  expandedFeatureCategory,
  policiesData,  // Add policiesData prop
  setExpandedFeatureCategory,
  showChatPolicyFeaturesDropdown,
  setShowChatPolicyFeaturesDropdown,
  floatingPolicy, // New prop for floating policy button
  onFloatingPolicyClick, // New prop for floating policy button click
  showPaymentModal, // New prop for payment modal
  setShowPaymentModal, // New prop setter for payment modal
  setPoliciesToCompare, // New prop to update policies to compare
  showComparePaymentModal, // New prop for compare payment modal
  setShowComparePaymentModal, // New prop setter for compare payment modal
  onComparePaymentOptionSelected, // New prop for handling compare payment option selection
  hasSeenComparePaymentModal, // New prop to track if user has seen compare payment modal
  setHasSeenComparePaymentModal, // New prop setter for hasSeenComparePaymentModal
  showChatHistorySidebar, // New prop for chat history sidebar
  setShowChatHistorySidebar, // New prop setter for chat history sidebar
  chatHistories, // New prop for chat histories
  currentChatId, // New prop for current chat ID
  onSelectChat, // New prop for selecting a chat
  userSubscription, // New prop for user subscription status
  onMobileCheckMyPolicyClick, // New prop for mobile check my policy button click
  onMobilePolicyFeaturesClick // New prop for mobile policy features button click
}) => {
  const [inputMessage, setInputMessage] = useState('');
  const chatEndRef = React.useRef(null);
  const messagesContainerRef = React.useRef(null);
  const [showPolicyListingInChat, setShowPolicyListingInChat] = useState(false);
  
  // State for expanded questions
  const [expandedQuestion, setExpandedQuestion] = useState(null);
  
  // State for comparison side panel
  const [showComparisonSidePanel, setShowComparisonSidePanel] = useState(false);
  
  // State for policy features dropdown
  const [showPolicyFeaturesDropdown, setShowPolicyFeaturesDropdown] = useState(false);
  
  // State for selected feature category name
  const [selectedFeatureCategoryName, setSelectedFeatureCategoryName] = useState('');
  
  // State for feature dropdown visibility
  const [featureDropdowns, setFeatureDropdowns] = useState({
    must: false,
    good: false,
    very: false
  });
  
  // State for controlling suggested questions scrolling
  const [shouldScrollQuestions, setShouldScrollQuestions] = useState(true); // Changed to true by default
  
  // Get window width for responsive behavior
  const windowWidth = useWindowWidth();
  
  // Define the policy features categories and their details
  const policyFeatures = [
    {
      id: 'must',
      title: 'Must To Have',
      description: 'Essential features that form the foundation of any good insurance policy',
      features: [
        'Claim Settlement Ratio',
         'Hospital Network',
         'Room Rent',
         'Copayment',
         'Restoration Benefit',
         'Post Hospitalisation Coverage',
      ]
    },
    {
      id: 'good',
      title: 'Good To Have',
      description: 'Valuable additions that significantly enhance your coverage experience',
      features: [
        'Waiting Period',
        'No Claim Bonus',
        'Disease Sub limits',
        'Alternate Treatment Coverage',
        'Maternity Care',
        'Newborn Care',
        'Health Checkups',
      ]
    },
    {
      id: 'very',
      title: 'Add On',
      description: 'Premium features that provide maximum protection and convenience',
      features: [
      'Domiciliary',
      'Outpatient Department',
      'Lifelong Renewal',
      'Critical Illness Rider',
      'Accident & Disability Rider',
      ]
    }
  ];
  
  // Toggle question expansion
  const toggleQuestion = (questionId) => {
    if (expandedQuestion === questionId) {
      setExpandedQuestion(null); // Close if already open
    } else {
      setExpandedQuestion(questionId); // Open the clicked question
    }
  };
  
  // Toggle feature dropdown
  const toggleFeatureDropdown = (featureId) => {
    setFeatureDropdowns(prev => ({
      ...prev,
      [featureId]: !prev[featureId]
    }));
  };
  
  useEffect(() => {
    // Scroll to the bottom of the chat when new messages arrive
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Handle expanded feature category from parent
  useEffect(() => {
    if (expandedFeatureCategory) {
      const feature = policyFeatures.find(f => f.id === expandedFeatureCategory);
      if (feature) {
        setSelectedFeatureCategoryName(feature.title);
        setExpandedQuestion(expandedFeatureCategory);
      }
    }
  }, [expandedFeatureCategory]);
  
  const handleSend = () => {
    if (inputMessage.trim() === '') return;
    onSendMessage(inputMessage, 'user'); // Send user message to App (which will handle Gemini API call)
    setInputMessage('');
    // Bot response is now handled by the App component's handleNewMessage function
  };
  
  // Function to get suggested questions based on context
  const getSuggestedQuestions = () => {
    // If we have policies for comparison
    if (policiesToCompare.length > 0) {
      if (policiesToCompare.length === 1) {
        return [
          `What are the key benefits of "${policiesToCompare[0].name}"?`,
          "How does this policy compare to others?",
          "What exclusions should I be aware of?",
          "Is this policy good for my situation?",
          "What is the claim process for this policy?",
          "Are there any hidden charges I should know about?",
          "How does the renewal process work?",
          "What are the payment options available?",
          "Is there a waiting period for any benefits?",
          "Can I customize this policy based on my needs?"
        ];
      } else if (policiesToCompare.length === 2) {
        return [
          "What are the main differences between these policies?",
          "Which one offers better value for money?",
          "How do their coverage levels compare?",
          "Which policy has better customer reviews?",
          "What are the claim settlement ratios for these policies?",
          "Which policy has more network hospitals/garages?",
          "How do the renewal terms differ between these policies?",
          "Which policy offers better add-on covers?",
          "What are the tax benefits for each of these policies?",
          "Which policy would you recommend for my specific needs?"
        ];
      } else {
        return [
          "Which of these policies offers the best coverage?",
          "How do the premiums compare across these policies?",
          "Are there any significant exclusions I should know about?",
          "Which policy would you recommend for my situation?",
          "What are the claim processes for each of these policies?",
          "Which policy has the highest customer satisfaction rating?",
          "How do the renewal terms differ across these policies?",
          "Which policy offers the most flexibility in customization?",
          "What are the co-payment requirements for each policy?",
          "Which policy has the widest network of service providers?"
        ];
      }
    }
    
    // If we have a selected policy type
    if (selectedPolicyType) {
      switch(selectedPolicyType) {
        case 'Health':
          return [
            "What health coverage options are available?",
            "How do I choose the right health insurance plan?",
            "What factors affect health insurance premiums?",
            "Can you explain deductibles and copays?",
            "What is the difference between individual and family floater plans?",
            "How do pre-existing conditions affect my coverage?",
            "What are the common exclusions in health insurance?",
            "How does the claim process work for health insurance?",
            "What are the tax benefits of health insurance?",
            "How do I find network hospitals near me?"
          ];
        case 'Term':
          return [
            "How much term life insurance do I need?",
            "What factors affect term life insurance premiums?",
            "What's the difference between term and whole life insurance?",
            "How do I choose the right policy term?",
            "What are the different types of term insurance plans?",
            "How do riders enhance my term insurance coverage?",
            "What is the claim settlement process for term insurance?",
            "How does my health affect my term insurance premium?",
            "What are the tax benefits of term insurance?",
            "Can I increase my coverage amount later?"
          ];
        case 'Motor':
          return [
            "What factors affect car insurance premiums?",
            "What coverage options are available?",
            "How do I choose the right deductible?",
            "What discounts are available for car insurance?",
            "What is the difference between comprehensive and third-party insurance?",
            "How does no-claim bonus work in motor insurance?",
            "What are the add-on covers available for motor insurance?",
            "How does the claim process work for motor insurance?",
            "What documents are required for motor insurance claim?",
            "How does my vehicle's age affect my insurance premium?"
          ];
        default:
          return [
            "What types of insurance do I need?",
            "How do I choose the right insurance policy?",
            "What factors affect insurance premiums?",
            "Can you explain the terms and conditions?",
            "What is the importance of insurance in financial planning?",
            "How do I assess my insurance needs?",
            "What are the common mistakes to avoid when buying insurance?",
            "How often should I review my insurance policies?",
            "What is the role of an insurance advisor?",
            "How do I compare different insurance policies effectively?"
          ];
      }
    }
    
    // Default questions if no specific context
    return [
      "What types of insurance do I need?",
      "How do I choose the right insurance policy?",
      "What factors affect insurance premiums?",
      "Can you explain the terms and conditions?",
      "What is the importance of insurance in financial planning?",
      "How do I assess my insurance needs?",
      "What are the common mistakes to avoid when buying insurance?",
      "How often should I review my insurance policies?",
      "What is the role of an insurance advisor?",
      "How do I compare different insurance policies effectively?"
    ];
  };
  
  const suggestedQuestions = getSuggestedQuestions();
  
  const handleQuestionClick = (question) => {
    setInputMessage(question);
    // Auto-send the question after a short delay
    setTimeout(() => {
      handleSend();
    }, 100);
  };
  
  // Function to render message text with clickable policy names
  const renderMessageWithClickablePolicies = (text, sender) => {
    // Regular expression to match policy names in quotes
    const policyNameRegex = /"([^"]+)"/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    
    while ((match = policyNameRegex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      
      // Add the clickable policy name
      const policyName = match[1];
      parts.push(
        <button
          key={`policy-${match.index}`}
          onClick={() => {
            // Find the policy by name
            const policy = policiesData.find(p => p.name === policyName);
            if (policy) {
              onPolicyNameClick(policy);
            }
          }}
          // Style based on sender (user or bot)
          className={`${sender === 'user' 
            ? 'text-white underline font-bold hover:bg-white/20 rounded px-1 py-0.5 transition-colors' 
            : 'text-cyan-600 hover:text-cyan-800 hover:underline font-medium'
          }`}
          aria-label={`View details for ${policyName}`}
        >
          {policyName}
        </button>
      );
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text after the last match
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }
    
    return parts;
  };
  
  // Handle compare button click - MODIFIED to show split screen immediately
  const handleCompareButtonClick = () => {
    setShowComparisonSidePanel(true);
  };
  
  // Handle close comparison panel
  const handleCloseComparisonPanel = () => {
    setShowComparisonSidePanel(false);
  };
  
  // Handle feature click in PolicyFeaturesPanel
  const handleFeatureClick = (feature) => {
    // Send a message to the chat about this feature
    const message = `Can you tell me more about "${feature}" in the context of ${selectedFeatureCategoryName || 'insurance policies'}?`;
    onSendMessage(message, 'user');
    // Close the panel
    setExpandedQuestion(null);
  };
  
  // Handle back to categories in PolicyFeaturesPanel
  const handleBackToCategories = () => {
    setExpandedQuestion(null);
    setShowPolicyFeaturesDropdown(true);
  };
  
  // Check if message contains payment-related keywords
  const isPaymentRelated = (text) => {
    const paymentKeywords = [
      'payment', 'pay', 'price', 'cost', 'fee', 'charge', 
      'purchase', 'buy', 'subscribe', 'premium', 'plan cost'
    ];
    return paymentKeywords.some(keyword => 
      text.toLowerCase().includes(keyword)
    );
  };
  
  // Check if any side panel is open
  const isBlockingSidePanelOpen = showMenuSidePanel || 
                               expandedQuestion || 
                               showComparisonSidePanel ||
                               showSingleComparison ||
                               showPaymentModal ||
                               showComparePaymentModal;
  
  // Handler for feature clicks in the dropdown - MODIFIED to keep panel open on desktop
  const handleChatFeatureClick = (feature) => {
    // Send a message to the chat about this feature
    const message = `Can you tell me more about "${feature}"?`;
    onSendMessage(message, 'user');
    // Only close the panel on mobile, keep it open on desktop
    if (windowWidth < 640) {
      setShowChatPolicyFeaturesDropdown(false);
    }
  };
  
  // Handle payment modal close
  const handlePaymentModalClose = () => {
    setShowPaymentModal(false);
  };
  
  // Handle payment success
  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    onPaymentScreenClick();
  };
  
  // Handle compare payment modal close
  const handleComparePaymentModalClose = () => {
    setShowComparePaymentModal(false);
    
    // Send message with policy names and "Compare" button
    const policyNames = policiesToCompare.map(p => `"${p.name}"`).join(', ');
    const message = `I would like to discuss comparing ${policyNames}. Can you help me understand the differences and recommend which one is better for my needs?`;
    onSendMessage(message, 'user');
  };
  
  // Handle compare payment option selection
  const handleComparePaymentOptionSelected = (option) => {
    setShowComparePaymentModal(false);
    
    if (option === 'free') {
      // For free option, show the split view comparison
      setShowComparisonSidePanel(true);
    } else if (option === 'subscription') {
      // For subscription option, navigate to payment screen
      onPaymentScreenClick();
    }
  };
  
  // Handle floating policy button click
  const handleFloatingPolicyButtonClick = () => {
    if (floatingPolicy) {
      // Set policies to compare to include only the floating policy
      setPoliciesToCompare([floatingPolicy]);
      // Show single comparison panel in split view
      setShowComparisonSidePanel(true);
    }
  };
  
  // Handle mobile check my policy button click
  const handleMobileCheckMyPolicyButtonClick = () => {
    onMobileCheckMyPolicyClick();
  };
  
  // Handle mobile policy features button click
  const handleMobilePolicyFeaturesButtonClick = () => {
    onMobilePolicyFeaturesClick();
  };
  
  return (
    <div className={`flex flex-col h-full bg-slate-50 flex-grow rounded-xl shadow-lg border border-gray-200 relative min-h-[calc(100vh-6rem)] ${(showComparisonSidePanel || showSingleComparison) ? 'sm:flex-row-reverse' : ''}`}>
      {/* Menu Side Panel */}
      <MenuSidePanel
        isOpen={showMenuSidePanel}
        onClose={() => setShowMenuSidePanel(false)}
        selectedPolicyType={selectedPolicyType}
        setSelectedPolicyType={setSelectedPolicyType}
        selectedBudget={selectedBudget}
        setSelectedBudget={setSelectedBudget}
        policiesToCompare={policiesToCompare}
        onCompareClick={onCompareClick}
        onClearComparison={onClearComparison}
        onGetAdvice={(policy) => {
          // Set the policy for advice highlighting
          onGetAdvice(policy);
          // Close the side panel immediately
          setShowMenuSidePanel(false);
        }}
        onUploadDocument={onUploadDocument}
        comparisonFeedback={comparisonFeedback}
        onChatWithPolicies={(policies, customMessage) => {
          setShowMenuSidePanel(false);
          // Use the custom message if provided, otherwise use the default
          const message = customMessage || `I would like to discuss comparing "${policies[0].name}"${policies.length > 1 ? ` and "${policies[1].name}"` : ''}. Can you help me understand the differences and recommend which one is better for my needs?`;
          onSendMessage(message, 'user');
        }}
        policyForAdvice={initialPolicyForChat}
        setShowMenuSidePanel={setShowMenuSidePanel}
        policiesData={policiesData}  // Pass policiesData
        onShowComparePaymentModal={() => setShowComparePaymentModal(true)}
      />
      
      {/* Chat History Sidebar */}
      <ChatHistorySidebar
        isOpen={showChatHistorySidebar}
        onNewChat={() => {
          // Create a new chat
          const newChatId = 'chat-' + Date.now();
          const newChat = {
            id: newChatId,
            title: 'New Chat',
            messages: [{ id: 1, text: initialBotMessageText, sender: 'bot' }]
          };
          // Update chat histories in parent
          // This is a simplified version - in a real app, you'd manage this in the parent
          onSelectChat(newChatId);
        }}
        onToggleChatSidebar={() => setShowChatHistorySidebar(false)}
        chatHistories={chatHistories}
        currentChatId={currentChatId}
        onSelectChat={onSelectChat}
        userSubscription={userSubscription}
      />
      
      {/* Policy Features Dropdown - Mobile only with enhanced styling */}
      {showChatPolicyFeaturesDropdown && windowWidth < 640 && (
        <div className="fixed top-16 left-0 right-0 bg-white shadow-xl z-50 p-4 sm:hidden border-b-4 border-cyan-500">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg text-cyan-700">Policy Features</h3>
            <button 
              onClick={() => setShowChatPolicyFeaturesDropdown(false)}
              className="p-1 rounded-full hover:bg-gray-200 transition-colors"
              aria-label="Close policy features"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Feature Dropdowns */}
          <div className="space-y-3">
            {policyFeatures.map((category) => (
              <div key={category.id} className="border border-gray-200 rounded-lg overflow-hidden">
                <button 
                  className="w-full text-left p-3 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors duration-200 font-medium shadow-md flex items-center justify-between"
                  onClick={() => toggleFeatureDropdown(category.id)}
                >
                  <span>{category.title}</span>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className={`h-5 w-5 transform transition-transform duration-200 ${featureDropdowns[category.id] ? 'rotate-180' : ''}`} 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l7 7m0 0l-7-7m7 7h18" />
                  </svg>
                </button>
                
                {featureDropdowns[category.id] && (
                  <div className="bg-white p-3 border-t border-gray-200">
                    <p className="text-sm text-gray-600 mb-3">{category.description}</p>
                    <ul className="space-y-2">
                      {category.features.map((feature, index) => (
                        <li key={index}>
                          <button
                            onClick={() => {
                              setSelectedFeatureCategoryName(category.title);
                              setExpandedQuestion(category.id);
                              setShowChatPolicyFeaturesDropdown(false);
                              handleFeatureClick(feature);
                            }}
                            className="w-full text-left p-2 bg-cyan-50 hover:bg-cyan-100 rounded-lg transition-colors duration-200 flex items-center justify-between group"
                          >
                            <span className="text-gray-700 group-hover:text-cyan-700 text-sm">{feature}</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-cyan-500 opacity-0 group-hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7-7m7 7H3" />
                            </svg>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-4 text-center">
            <button 
              onClick={() => setShowChatPolicyFeaturesDropdown(false)}
              className="text-cyan-600 font-medium text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      
      {/* Full-screen Policy Features Dropdown for Desktop */}
      {showChatPolicyFeaturesDropdown && windowWidth >= 640 && (
        <PolicyFeaturesFullScreenDropdown
          isOpen={showChatPolicyFeaturesDropdown}
          onClose={() => setShowChatPolicyFeaturesDropdown(false)}
          onFeatureClick={handleChatFeatureClick}
          policyFeatures={policyFeatures}
        />
      )}
      
      {/* Policy Listing Overlay in Chat */}
      {showPolicyListingInChat && (
        <div className="absolute inset-0 bg-white z-50 p-4 overflow-y-auto">
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <h1 className="text-xl sm:text-3xl font-semibold text-gray-800">
              {selectedPolicyType} Plans
            </h1>
            <button 
              onClick={() => setShowPolicyListingInChat(false)}
              className="p-1 sm:p-2 text-gray-600 hover:bg-gray-200 rounded-full transition-colors duration-200"
              aria-label="Close policy listing"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Policy Cards Grid */}
          <div className="flex flex-col gap-4 sm:gap-6">
            {policiesData
              .filter(policy => policy.type === selectedPolicyType)
              .sort((a, b) => b.rating - a.rating)
              .map((policy) => (
                <div key={policy.id} className="bg-white rounded-xl shadow-md p-3 sm:p-4 border border-gray-200 hover:shadow-lg transition-shadow duration-200">
                  <div className="flex flex-col sm:flex-row justify-between items-start">
                    <div className="flex-1 pr-0 sm:pr-6 mb-3 sm:mb-0">
                      <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-1">{policy.name}</h2>
                      <p className="text-gray-600 text-xs sm:text-sm mb-1">{policy.company}</p>
                      <p className="text-gray-600 text-xs sm:text-sm">{policy.shortDescription}</p>
                    </div>
                    <div className="flex flex-col items-end text-right min-w-[80px] sm:min-w-[90px] ml-0 sm:ml-4">
                      <div className="text-xs sm:text-sm text-gray-700 mb-2">
                        <div className="font-medium">Price: {policy.priceRange}</div>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="text-xs sm:text-sm text-yellow-500 mb-1">
                          {'★'.repeat(Math.floor(policy.rating))}
                          {policy.rating % 1 !== 0 && '★'}
                        </div>
                        <div className="text-xs text-gray-600">({policy.reviewsCount} reviews)</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-3 mt-4">
                    <button
                      onClick={() => onGetAdvice(policy)}
                      className="bg-cyan-100 text-cyan-700 py-2 px-4 rounded-lg hover:bg-cyan-200 transition-colors duration-200 text-xs sm:text-sm font-medium"
                      aria-label={`Get unbiased advice for ${policy.name}`}
                    >
                      Get Unbiased Advice
                    </button>
                    <button
                      onClick={() => onCompareClick(policy)}
                      disabled={policiesToCompare.length >= 5 && !policiesToCompare.some(p => p.id === policy.id)} // Updated to 5
                      className={`py-2 px-4 rounded-lg transition-colors duration-200 text-xs sm:text-sm font-medium
                        ${policiesToCompare.some(p => p.id === policy.id)
                          ? 'bg-purple-500 text-white hover:bg-purple-600 shadow-md'
                          : policiesToCompare.length >= 5
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      aria-label={`${policiesToCompare.some(p => p.id === policy.id) ? 'Selected for comparison' : `Compare ${policy.name}`}`}
                      aria-pressed={policiesToCompare.some(p => p.id === policy.id)}
                    >
                      {policiesToCompare.some(p => p.id === policy.id) ? 'Selected' : 'Compare'}
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
      
      {/* Split Screen View - Comparison on left, Chat on right (desktop only) */}
      {(showComparisonSidePanel || showSingleComparison) && (
        <div className="hidden sm:block sm:w-1/2">
          <PolicyComparisonSidePanel 
            policies={policiesToCompare}
            onClose={() => {
              setShowComparisonSidePanel(false);
              setShowSingleComparison(false);
            }}
            onSendMessage={onSendMessage}
            isSplitView={true}
            onFeatureClick={onFeatureClick}
          />
        </div>
      )}
      
      {/* Regular Chat Interface */}
      <div className={`flex flex-col flex-grow overflow-hidden ${(showComparisonSidePanel || showSingleComparison) ? 'sm:w-1/2' : 'w-full'}`}>
        {/* Chat messages container with proper scrolling */}
        <div 
          ref={messagesContainerRef}
          className="flex-grow overflow-y-auto p-3 sm:p-4 thin-scrollbar"
        >
          <div className="w-full max-w-2xl mx-auto">
            <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 mb-4 sm:mb-6 text-center">Hello, Policy Advisor</h1>
            
            {/* Initial message with clickable policy name */}
            {initialPolicyForChat && messages.length === 0 && (
              <div className="flex justify-start mb-4">
                <div className="p-3 sm:p-4 rounded-xl max-w-[80%] break-words shadow-sm bg-white text-black">
                  Hello! I'm your Policy Advisor. You're viewing{" "}
                  <button 
                    className="text-cyan-600 font-medium hover:underline"
                    onClick={() => onPolicyNameClick(initialPolicyForChat)}
                  >
                    {initialPolicyForChat.name}
                  </button>
                  . What would you like to know about this policy?
                </div>
              </div>
            )}
            
            {messages.length === 0 && !initialPolicyForChat && (
              <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8 text-center max-w-md">
                {initialBotMessageText}
              </p>
            )}
            
            <div className="space-y-3 sm:space-y-4">
              {messages.map((message) => {
                // Check if this is a comparison message
                const isComparisonMessage = message.sender === 'user' && 
                  message.text.includes('I would like to discuss comparing') &&
                  message.text.includes('Can you help me understand the differences');
                
                // Check if this is a payment-related message
                const isPaymentMessage = isPaymentRelated(message.text);
                
                return (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`p-3 sm:p-4 rounded-xl max-w-[80%] break-words shadow-sm
                        ${message.sender === 'user'
                          ? 'bg-cyan-600 text-white shadow-md'
                          : 'bg-white text-black shadow-sm'
                        }`}
                    >
                      {/* Check if message contains HTML (from Gemini API) */}
                      {message.sender === 'bot' && message.text.includes('<div') ? (
                        <div 
                          dangerouslySetInnerHTML={{ __html: message.text }}
                          className="gemini-response"
                        />
                      ) : (message.sender === 'bot' || message.sender === 'user') && message.text.includes('"') ? (
                        isComparisonMessage ? (
                          <div>
                            {renderMessageWithClickablePolicies(
                              message.text.replace(' Compare', ''), // Remove "Compare" from text
                              message.sender
                            )}
                            <button
                              onClick={handleCompareButtonClick}
                              className="mt-2 bg-white text-cyan-600 hover:bg-gray-100 text-xs sm:text-sm font-medium py-1 px-3 rounded-lg transition-colors duration-200"
                              aria-label="Compare policies"
                            >
                              Compare
                            </button>
                          </div>
                        ) : isPaymentMessage && message.sender === 'bot' ? (
                          <div>
                            {renderMessageWithClickablePolicies(message.text, message.sender)}
                            <button
                              onClick={() => setShowPaymentModal(true)}
                              className="mt-2 bg-cyan-600 text-white hover:bg-cyan-700 text-xs sm:text-sm font-medium py-1 px-3 rounded-lg transition-colors duration-200"
                              aria-label="Proceed to payment"
                            >
                              Proceed to Payment
                            </button>
                          </div>
                        ) : (
                          renderMessageWithClickablePolicies(message.text, message.sender)
                        )
                      ) : (
                        message.text
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>
          </div>
        </div>
        
        {/* Bottom section with suggested questions, input message bar, and tip */}
        <div className="mt-auto border-t border-gray-200 bg-white">
          {/* Suggested Questions Section */}
          <div className="px-3 sm:px-4 py-2 bg-white border-b border-gray-200">
            <p className="text-xs sm:text-sm text-gray-600 mb-1 text-center"></p>
            
            {/* Auto-scrolling questions for both mobile and desktop */}
            <AutoScrollingQuestions 
              questions={suggestedQuestions}
              onQuestionClick={handleQuestionClick}
              shouldScroll={shouldScrollQuestions}
            />
          </div>
          
          {/* Input message bar */}
          <div className="p-3 sm:p-4 bg-slate-50">
            <div className="w-full max-w-2xl mx-auto flex flex-col">
              <div className="flex items-center border border-gray-300 rounded-2xl bg-white shadow-sm px-2 py-2">
                <button className="p-1 sm:p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors duration-200" aria-label="Add attachment">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </button>
                {/* Policy Features button for desktop only */}
                <button 
                  onClick={() => setShowChatPolicyFeaturesDropdown(!showChatPolicyFeaturesDropdown)}
                  className="text-cyan-600 font-medium text-xs sm:text-sm mr-2 flex items-center hidden sm:flex"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a4 4 0 11-8 0v2m8-2a4 4 0 108 0v2M5 19l2-2m-2 2l-2-2m7-10l-2-2m2 2l2-2" />
                  </svg>
                  <span>Tools</span>
                </button>
                <input
                  type="text"
                  placeholder="Ask Policy Advisor..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSend();
                    }
                  }}
                  className="flex-grow p-2 rounded-2xl focus:outline-none bg-transparent font-inter text-sm"
                  aria-label="Ask Policy Advisor"
                />
                {inputMessage.trim() ? (
                  <button
                    onClick={handleSend}
                    className="bg-cyan-600 text-white p-1 sm:p-2 rounded-full hover:bg-cyan-700 transition duration-200 ml-2"
                    aria-label="Send message"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                ) : (
                  <button className="p-1 sm:p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors duration-200 ml-2" aria-label="More options">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a4 4 0 11-8 0v2m8-2a4 4 0 108 0v2M5 19l2-2m-2 2l-2-2m7-10l-2-2m2 2l2-2" />
                    </svg>
                  </button>
                )}
              </div>
              
              {/* Policy Features button for mobile only - after search bar */}
              <div className="flex justify-center mt-2 sm:hidden">
                <button 
                  onClick={handleMobilePolicyFeaturesButtonClick}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center transition-colors duration-200 shadow-md"
                  aria-label="Policy Features"
                >
                  {/* Grid icon made of small squares */}
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  <span>Choose Policy</span>
                </button>
              </div>
            </div>
          </div>
          
          {/* Tip section */}
          <div className="px-3 sm:px-4 pb-3 sm:pb-4 bg-slate-50">
            <div className="w-full max-w-2xl mx-auto">
              <div className="mt-2 bg-cyan-50 rounded-lg p-3 border border-cyan-100">
                <div className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-500 mt-0.5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-xs text-cyan-700">
                    <span className="font-medium">Tip:</span> Explore different policy features to find the best coverage for your needs
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Floating Policy Button - Only shown on desktop */}
      {floatingPolicy && windowWidth >= 640 && (
        <button
          onClick={handleFloatingPolicyButtonClick}
          className="hidden sm:flex fixed left-40 top-20 z-20 items-center bg-cyan-600 text-white px-4 py-3 rounded-lg shadow-lg transition-all duration-300 hover:bg-cyan-700 hover:shadow-xl"
          aria-label={`View ${floatingPolicy.name} details`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="font-medium">{floatingPolicy.name}</span>
        </button>
      )}
      
      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 relative">
            {/* Close button */}
            <button 
              onClick={handlePaymentModalClose}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 z-10"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="p-6">
              <h2 className="text-2xl font-bold text-center mb-6">Ready to get started?</h2>
              <p className="text-center text-gray-600 mb-8">Organize your inbox with the click of a button</p>
              
              <div className="space-y-4 mb-8">
                {/* Starter Plan */}
                <div className="border border-gray-200 rounded-lg p-4 hover:border-cyan-300 transition-colors">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-lg">Starter Plan</h3>
                    <span className="text-cyan-600 font-bold">Free</span>
                  </div>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center">
                      <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Delete up to 2000 emails
                    </li>
                    <li className="flex items-center">
                      <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Basic AI categorization
                    </li>
                  </ul>
                  <button className="w-full mt-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors">
                    Current Plan
                  </button>
                </div>
                
                {/* One Time Fee Plan */}
                <div className="border-2 border-cyan-500 rounded-lg p-4 relative">
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-cyan-500 text-white text-xs px-3 py-1 rounded-full">
                    POPULAR
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-lg">One Time Fee Plan</h3>
                    <span className="text-cyan-600 font-bold">199</span>
                  </div>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center">
                      <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Unlimited deletions
                    </li>
                    <li className="flex items-center">
                      <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Advanced AI filtering
                    </li>
                    <li className="flex items-center">
                      <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Priority support
                    </li>
                  </ul>
                  <button 
                    onClick={handlePaymentSuccess}
                    className="w-full mt-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
                  >
                    Upgrade Now
                  </button>
                </div>
                
                {/* Subscription Plan */}
                <div className="border border-gray-200 rounded-lg p-4 hover:border-cyan-300 transition-colors">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-lg">Subscription Plan</h3>
                    <span className="text-cyan-600 font-bold">299/year</span>
                  </div>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center">
                      <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Unlimited deletions
                    </li>
                    <li className="flex items-center">
                      <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Advanced AI filtering
                    </li>
                    <li className="flex items-center">
                      <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Priority support
                    </li>
                    <li className="flex items-center">
                      <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Monthly updates
                    </li>
                  </ul>
                  <button className="w-full mt-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors">
                    Subscribe
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Compare Payment Modal */}
      {showComparePaymentModal && (
        <PaymentModalForCompare
          onCancel={handleComparePaymentModalClose}
          onOptionSelected={handleComparePaymentOptionSelected}
          policiesToCompare={policiesToCompare}
        />
      )}
      
      {/* Check My Policy Free Button - Only shown when blocking side panels are not open */}
      {!isBlockingSidePanelOpen && (
        <div className="absolute right-4 top-4 z-10">
          {/* Desktop version - original functionality */}
          <button
            onClick={onMenuClick}
            className="hidden sm:flex px-6 py-3 bg-gradient-to-r from-cyan-600 to-teal-500 text-white rounded-xl hover:from-cyan-700 hover:to-teal-600 transition-colors duration-200 text-base font-bold shadow-lg items-center"
            aria-label="Check My Policy Free"
          >
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            Choose Policy
          </button>
          
          {/* Mobile version - swapped functionality */}
          <button
            onClick={handleMobileCheckMyPolicyButtonClick}
            className="sm:hidden px-6 py-3 bg-gradient-to-r from-cyan-600 to-teal-500 text-white rounded-xl hover:from-cyan-700 hover:to-teal-600 transition-colors duration-200 text-base font-bold shadow-lg items-center"
            aria-label="Policy Features"
          >
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a4 4 0 11-8 0v2m8-2a4 4 0 108 0v2M5 19l2-2m-2 2l-2-2m7-10l-2-2m2 2l2-2" />
              </svg>
            </div>
            Policy Features
          </button>
        </div>
      )}
      
      {/* Mobile Policy Comparison Overlay */}
      {showComparisonSidePanel && (
        <div className="sm:hidden">
          <PolicyComparisonSidePanel 
            policies={policiesToCompare}
            onClose={handleCloseComparisonPanel}
            onSendMessage={onSendMessage}
            isSplitView={false}
            onFeatureClick={onFeatureClick}
          />
        </div>
      )}
      
      {/* Policy Features Panel */}
      {expandedQuestion && (
        <PolicyFeaturesPanel 
          featureCategory={expandedQuestion} 
          onClose={() => {
            setExpandedQuestion(null);
            setExpandedFeatureCategory(null);
          }} 
          onBackToCategories={handleBackToCategories}
          onFeatureClick={handleFeatureClick}
          categoryName={selectedFeatureCategoryName}
          selectedPolicyType={selectedPolicyType}  // Pass selectedPolicyType
          policiesData={policiesData}  // Pass policiesData
        />
      )}
    </div>
  );
};

// Main App component that orchestrates all screens and navigation
const App = () => {
  // ============================================================================
  // API Data State
  // ============================================================================
  const [policiesData, setPoliciesData] = useState(fallbackPoliciesData); // Start with fallback
  const [isLoadingPolicies, setIsLoadingPolicies] = useState(true);
  const [apiError, setApiError] = useState(null);
  
  // ============================================================================
  // Screen Navigation State
  // ============================================================================
  const [currentScreen, setCurrentScreen] = useState('home');
  const [selectedPolicyType, setSelectedPolicyType] = useState(null);
  const [selectedBudget, setSelectedBudget] = useState('5000'); // Default budget set to match slider min
  const [selectedPolicyId, setSelectedPolicyId] = useState(null);
  const [uploadedPolicyFileName, setUploadedPolicyFileName] = useState(null);
  const [policiesToCompare, setPoliciesToCompare] = useState([]); // State to hold policies for comparison (can be 1, 2, or 0)
  const [comparisonFeedback, setComparisonFeedback] = useState(''); // Feedback for comparison selection
  const [showMenuSidePanel, setShowMenuSidePanel] = useState(false); // New state for menu side panel
  const [initialPolicyForChat, setInitialPolicyForChat] = useState(null); // State for initial policy in chat
  const [isDirectChatAccess, setIsDirectChatAccess] = useState(false); // New state to track if chat was accessed directly
  const [policyForAdvice, setPolicyForAdvice] = useState(null); // New state to track policy selected for advice
  const [showSingleComparison, setShowSingleComparison] = useState(false); // New state for single policy comparison
  const [expandedFeatureCategory, setExpandedFeatureCategory] = useState(null); // New state for expanded feature category
  const [showChatPolicyFeaturesDropdown, setShowChatPolicyFeaturesDropdown] = useState(false); // New state for chat policy features dropdown
  
  // NEW: State for floating policy button
  const [floatingPolicy, setFloatingPolicy] = useState(null);
  
  // NEW: State for payment modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  // NEW: State for compare payment modal
  const [showComparePaymentModal, setShowComparePaymentModal] = useState(false);
  
  // NEW: State to track if user has seen compare payment modal
  const [hasSeenComparePaymentModal, setHasSeenComparePaymentModal] = useState(false);
  
  // NEW: State for chat history sidebar
  const [showChatHistorySidebar, setShowChatHistorySidebar] = useState(false);
  
  // NEW: State for user subscription status
  const [userSubscription, setUserSubscription] = useState('Free');
  
  // ============================================================================
  // Fetch Policies from Backend on Mount
  // ============================================================================
  useEffect(() => {
    const loadPolicies = async () => {
      setIsLoadingPolicies(true);
      setApiError(null);
      try {
        const policies = await fetchPoliciesFromAPI();
        if (policies && policies.length > 0) {
          // Transform policies to include features in the UI format
          const transformedPolicies = policies.map(policy => {
            const mustHave = [];
            const goodToHave = [];
            const addOns = [];

            // Map Must Have features
            if (policy.claim_settlement_ratio) mustHave.push(`Claim Settlement Ratio: ${policy.claim_settlement_ratio}`);
            if (policy.hospital_network) mustHave.push(`Hospital Network: ${policy.hospital_network}`);
            if (policy.room_rent) mustHave.push(`Room Rent: ${policy.room_rent}`);
            if (policy.copayment) mustHave.push(`Copayment: ${policy.copayment}`);
            if (policy.restoration_benefit) mustHave.push(`Restoration Benefit: ${policy.restoration_benefit}`);
            if (policy.pre_post_hospitalization_coverage) mustHave.push(`Pre & Post Hospitalization: ${policy.pre_post_hospitalization_coverage}`);

            // Map Good to Have features
            if (policy.waiting_period) goodToHave.push(`Waiting Period: ${policy.waiting_period}`);
            if (policy.no_claim_bonus) goodToHave.push(`No Claim Bonus: ${policy.no_claim_bonus}`);
            if (policy.disease_sub_limits) goodToHave.push(`Disease Sub-limits: ${policy.disease_sub_limits}`);
            if (policy.alternate_treatment_coverage) goodToHave.push(`AYUSH Treatment: ${policy.alternate_treatment_coverage}`);
            if (policy.maternity_care) goodToHave.push(`Maternity Care: ${policy.maternity_care}`);
            if (policy.newborn_care) goodToHave.push(`Newborn Care: ${policy.newborn_care}`);
            if (policy.health_checkups) goodToHave.push(`Health Checkups: ${policy.health_checkups}`);

            // Map Add-ons
            if (policy.domiciliary) addOns.push(`Domiciliary: ${policy.domiciliary}`);
            if (policy.outpatient_department) addOns.push(`OPD Coverage: ${policy.outpatient_department}`);
            if (policy.lifelong_renewal) addOns.push(`Lifelong Renewal: ${policy.lifelong_renewal}`);
            if (policy.critical_illness_rider) addOns.push(`Critical Illness Rider: ${policy.critical_illness_rider}`);
            if (policy.accident_disability_rider) addOns.push(`Accident & Disability Rider: ${policy.accident_disability_rider}`);

            return {
              ...policy,
              mustHave: mustHave.length > 0 ? mustHave : (policy.benefits || []),
              goodToHave: goodToHave.length > 0 ? goodToHave : (policy.exclusions || []),
              addOns: addOns.length > 0 ? addOns : (policy.eligibility || [])
            };
          });

          setPoliciesData(transformedPolicies);
          console.log(`✅ Loaded ${transformedPolicies.length} policies from backend`);
        } else {
          console.log('⚠️ No policies from API, using fallback data');
        }
      } catch (error) {
        console.error('Failed to load policies:', error);
        setApiError('Failed to connect to backend. Using sample data.');
      } finally {
        setIsLoadingPolicies(false);
      }
    };
    loadPolicies();
  }, []); // Run once on mount
  
  const initialChatId = 'chat-initial-' + Date.now();
  
  // Generate initial bot message based on whether a policy type is already selected
  const getInitialBotMessageText = (policyType, policiesForChat = [], uploadedDocName = null, selectedBudget = '5000') => { // Now accepts an array of policies, optional uploaded doc, and selected budget
    if (policiesForChat.length === 2 && uploadedDocName) {
      const [policy1, policy2] = policiesForChat;
      return `Hello! I see you're comparing "${policy1.name}", "${policy2.name}", and your uploaded document "${uploadedDocName}". What would you like to know about these policies?`;
    } else if (policiesForChat.length === 2) {
      const [policy1, policy2] = policiesForChat;
      return `Hello! I see you're comparing "${policy1.name}" and "${policy2.name}". What would you like to know about these two policies?`;
    } else if (policiesForChat.length === 1 && uploadedDocName) { // New condition for 1 internal + 1 external
        const policy = policiesForChat[0];
        return `Hello! I see you're comparing "${policy.name}" and your uploaded document "${uploadedDocName}". What would you like to know about these two?`;
    }
    else if (policiesForChat.length === 1) {
      const policy = policiesForChat[0];
      return `Hello! I'm your Policy Advisor. You're viewing "${policy.name}". What would you like to know about this policy?`;
    }
    return policyType
      ? `Hello! I'm your Policy Advisor. I can help you with ${policyType.toLowerCase()} insurance decisions with a budget around ${parseInt(selectedBudget).toLocaleString('en-IN')}. What would you like to know about ${policyType} policies?`
      : `Hello! I'm your Policy Advisor. I can help you with insurance decisions. What types of policies are you interested in?`;
  }
  
  const [chatHistories, setChatHistories] = useState([
    { id: initialChatId, title: 'New Chat', messages: [{ id: 1, text: getInitialBotMessageText(null), sender: 'bot' }] } // Default initial message
  ]);
  const [currentChatId, setCurrentChatId] = useState(initialChatId);
  const [isChatSidebarOpen, setIsChatSidebarOpen] = useState(false); // Default to closed
  
  // Effect to update the initial message if selectedPolicyType or selectedBudget changes
  useEffect(() => {
    // Only update if we are on the initial chat and it has only one bot message
    if (currentChatId === initialChatId && chatHistories.find(chat => chat.id === initialChatId)?.messages.length === 1 && chatHistories.find(chat => chat.id === initialChatId)?.messages[0].sender === 'bot') {
      const updatedInitialBotMessageText = selectedPolicyType
        ? `Hello! I'm your Policy Advisor. I can help you with ${selectedPolicyType.toLowerCase()} insurance decisions with a budget around ${parseInt(selectedBudget).toLocaleString('en-IN')}. What would you like to know about ${selectedPolicyType} policies?`
        : `Hello! I'm your Policy Advisor. I can help you with insurance decisions. What types of policies are you interested in?`;
      setChatHistories(prevHistories => prevHistories.map(chat =>
        chat.id === initialChatId
          ? { ...chat, messages: [{ id: 1, text: updatedInitialBotMessageText, sender: 'bot' }] }
          : chat
      ));
    }
  }, [selectedPolicyType, selectedBudget, currentChatId, initialChatId, chatHistories]); // Added dependencies
  
  // Chat-related functions
  const handleNewChat = (policiesForChat = [], uploadedDocName = null, initialPolicy = null) => { // Now accepts an array of policies and optional uploaded doc
    const newChatId = 'chat-' + Date.now();
    let messages = [];
    
    // Only add the initial bot message if there's no initial policy
    if (!initialPolicy) {
      messages = [{ id: 1, text: getInitialBotMessageText(selectedPolicyType, policiesForChat, uploadedDocName, selectedBudget), sender: 'bot' }];
    }
    
    const newChatSession = {
      id: newChatId,
      title: 'New Chat', // Will be updated by first user message
      messages: messages
    };
    setChatHistories((prev) => [...prev, newChatSession]);
    setCurrentChatId(newChatId);
  };
  
  const handleNewMessage = async (message, sender) => {
    // Add user message immediately
    setChatHistories((prevHistories) =>
      prevHistories.map((chat) =>
        chat.id === currentChatId
          ? {
              ...chat,
              messages: [...chat.messages, { id: chat.messages.length + 1, text: message, sender }],
              // Update title if it's the first user message in a new chat or if title is generic
              title: chat.title === 'New Chat' && sender === 'user' ? message.substring(0, 30) + (message.length > 30 ? '...' : '') : chat.title
            }
          : chat
      )
    );
    
    // If this is a user message, call Gemini API for bot response
    if (sender === 'user') {
      // Show "thinking..." message
      const thinkingMessageId = Date.now();
      setChatHistories((prevHistories) =>
        prevHistories.map((chat) =>
          chat.id === currentChatId
            ? {
                ...chat,
                messages: [...chat.messages, { id: thinkingMessageId, text: '...', sender: 'bot' }]
              }
            : chat
        )
      );
      
      try {
        // Get current policy context (if available)
        const currentPolicy = policiesToCompare.length > 0 ? policiesToCompare[0] : policyForAdvice;
        
        if (currentPolicy) {
          // Get chat history for context
          const currentChat = chatHistories.find(chat => chat.id === currentChatId);
          const chatHistory = currentChat ? currentChat.messages.map(msg => ({
            sender: msg.sender,
            text: msg.text
          })) : [];
          
          // Call Gemini API
          const geminiResponse = await askGeminiQuestion(currentPolicy, message, chatHistory);
          
          // Replace thinking message with actual response
          setChatHistories((prevHistories) =>
            prevHistories.map((chat) =>
              chat.id === currentChatId
                ? {
                    ...chat,
                    messages: chat.messages.map(msg =>
                      msg.id === thinkingMessageId
                        ? { ...msg, text: geminiResponse.response, followUpQuestions: geminiResponse.followUpQuestions }
                        : msg
                    )
                  }
                : chat
            )
          );
        } else {
          // No policy selected - provide general response
          const generalResponse = "I'm here to help with policy questions. Please select a policy from the policy listing page or tell me what type of insurance you're interested in!";
          setChatHistories((prevHistories) =>
            prevHistories.map((chat) =>
              chat.id === currentChatId
                ? {
                    ...chat,
                    messages: chat.messages.map(msg =>
                      msg.id === thinkingMessageId
                        ? { ...msg, text: generalResponse }
                        : msg
                    )
                  }
                : chat
            )
          );
        }
      } catch (error) {
        console.error('Error getting Gemini response:', error);
        // Replace thinking message with error message
        setChatHistories((prevHistories) =>
          prevHistories.map((chat) =>
            chat.id === currentChatId
              ? {
                  ...chat,
                  messages: chat.messages.map(msg =>
                    msg.id === thinkingMessageId
                      ? { ...msg, text: 'Sorry, I encountered an error processing your question. Please try again.' }
                      : msg
                  )
                }
              : chat
          )
        );
      }
    }
  };
  
  // Handler for desktop feature clicks
  const handleDesktopFeatureClick = (feature) => {
    setShowChatPolicyFeaturesDropdown(false);
    
    // If we are not on the chat screen, navigate to it
    if (currentScreen !== 'policyAdvisorChat') {
      navigateTo('policyAdvisorChat');
    }
    
    // Send a message about the feature
    const message = `Can you tell me more about "${feature}"?`;
    handleNewMessage(message, 'user');
  };
  
  // Navigation function to change the current screen
  const navigateTo = (screenName, data = null, preservePolicies = false) => {
    // Only clear policies if not preserving them
    if (!preservePolicies) {
      setPoliciesToCompare([]);
      setComparisonFeedback('');
      setShowSingleComparison(false); // Close single comparison view
      setExpandedFeatureCategory(null); // Close feature category panel
      setFloatingPolicy(null); // Clear floating policy
      setShowPaymentModal(false); // Close payment modal
      setShowComparePaymentModal(false); // Close compare payment modal
    }
    
    setCurrentScreen(screenName);
    
    // Always reset these states when going to home
    if (screenName === 'home') {
      setSelectedPolicyType(null);
      setSelectedBudget('5000');
      setPoliciesToCompare([]);
      setComparisonFeedback('');
      setInitialPolicyForChat(null);
      setUploadedPolicyFileName(null);
      setShowMenuSidePanel(false);
      setIsDirectChatAccess(false);
      setPolicyForAdvice(null);
      setShowSingleComparison(false);
      setExpandedFeatureCategory(null);
      setShowChatPolicyFeaturesDropdown(false);
      setFloatingPolicy(null);
      setShowPaymentModal(false);
      setShowComparePaymentModal(false);
      setHasSeenComparePaymentModal(false);
      setShowChatHistorySidebar(false);
    }
    
    // Only scroll to top if not directly showing listing below selection
    if (screenName !== 'policyListing') {
        window.scrollTo(0, 0);
    }
    if (screenName === 'policyDetails' && data) {
      setSelectedPolicyId(data); // Set policy ID for details
    } else if (screenName === 'policyListing' && data) {
      setSelectedPolicyType(data); // Set policy type for listings
    }
    
    // Set direct chat access flag when navigating to chat screen
    if (screenName === 'policyAdvisorChat') {
      setIsDirectChatAccess(!selectedPolicyType && !selectedBudget && policiesToCompare.length === 0);
    } else {
      setIsDirectChatAccess(false);
    }
  };
  
  // Determines the title to display in the TopBar for the current screen
  const getScreenTitle = () => {
    switch (currentScreen) {
      case 'home': return '';
      case 'signUp': return 'Sign Up';
      case 'policyAdvisorChat': return '';
      case 'policyListing': return selectedPolicyType ? `${selectedPolicyType} Plans` : 'All Recommended Plans'; // Changed to reflect all policies if no type selected
      case 'policyDetails': return 'Policy Details';
      case 'login': return 'Log In';
      case 'uploadDocument': return 'Upload Policy Document'; // New title for upload screen
      case 'payment': return 'Payment'; // New title for payment screen
      default: return '';
    }
  };
  
  // Determines if the back button should be shown based on current screen logic
  const showBackButtonForScreen = () => {
    // Show back button specifically for selectionScreen, but hide for home/auth screens
    if (currentScreen === 'home' || currentScreen === 'signUp' || currentScreen === 'login') {
      return false;
    }
    return true; // For other screens, generally show back button
  };
  
  // Determines if the auth buttons should be shown in the TopBar
  const showAuthButtonsForScreen = () => {
    return currentScreen === 'home';
  };
  
  // Determines if the close button should be shown in the TopBar
  const showCloseButtonForScreen = () => {
    return currentScreen === 'policyAdvisorChat' && (
      showMenuSidePanel || 
      expandedFeatureCategory || 
      showSingleComparison || 
      showSingleComparison ||
      showPaymentModal ||
      showComparePaymentModal ||
      showChatHistorySidebar
    );
  };
  
  // FIXED: Handle clicking "Check My Policy Free" button on HomeScreen
  const handleCheckMyPolicyFromHome = () => {
    // Reset selections
    setSelectedPolicyType(null);
    setSelectedBudget('5000');
    setPoliciesToCompare([]);
    setComparisonFeedback('');
    setPolicyForAdvice(null);
    setShowSingleComparison(false);
    setExpandedFeatureCategory(null);
    setFloatingPolicy(null);
    setShowPaymentModal(false);
    setShowComparePaymentModal(false);
    setHasSeenComparePaymentModal(false);
    
    // Navigate directly to chat screen first
    navigateTo('policyAdvisorChat');
    
    // Then start a new chat session after navigation to prevent flicker
    setTimeout(() => {
      handleNewChat();
    }, 0);
  };
  
  // Handle clicking "Explore Policy Types" button on HomeScreen
  const handleExplorePolicyTypesFromHome = () => {
    // Reset selections
    setSelectedPolicyType(null);
    setSelectedBudget('5000');
    setPoliciesToCompare([]);
    setComparisonFeedback('');
    setPolicyForAdvice(null);
    setShowSingleComparison(false);
    setExpandedFeatureCategory(null);
    setFloatingPolicy(null);
    setShowPaymentModal(false);
    setShowComparePaymentModal(false);
    setHasSeenComparePaymentModal(false);
    
    // Navigate to policy listing screen
    navigateTo('policyListing');
  };
  
  // UPDATED: handleMenuClick function to use the new navigation function
  const handleMenuClick = () => {
    // Toggle the side panel instead of navigating to a new screen
    setShowMenuSidePanel(prev => !prev);
  };
  
  const handleDocumentUploadSuccess = (fileName) => {
    setUploadedPolicyFileName(fileName);
    navigateTo('policyAdvisorChat');
    handleNewChat([], fileName);
  };
  
  // Handles back button clicks, navigating to the previous logical screen
  const handleBackClick = () => {
    // NEW: If in chat screen with menu side panel open, go directly to home
    if (currentScreen === 'policyAdvisorChat' && showMenuSidePanel) {
      setShowMenuSidePanel(false);
      navigateTo('home');
      return;
    }
    
    switch (currentScreen) {
      case 'policyListing': // This case is now specifically for direct menu navigation
        navigateTo('home'); // Go back to home screen
        break;
      case 'policyDetails':
        navigateTo('policyListing', selectedPolicyType); // Go back to listing with the same policy type
        setSelectedPolicyId(null); // Clear selected policy detail
        break;
      case 'policyAdvisorChat':
        // MODIFIED: Always go to home screen from chatbot screen
        // Reset all relevant states
        setSelectedPolicyType(null);
        setSelectedBudget('5000');
        setPoliciesToCompare([]);
        setComparisonFeedback('');
        setInitialPolicyForChat(null);
        setUploadedPolicyFileName(null);
        setShowMenuSidePanel(false);
        setIsDirectChatAccess(false);
        setPolicyForAdvice(null);
        setShowSingleComparison(false);
        setExpandedFeatureCategory(null);
        setShowChatPolicyFeaturesDropdown(false);
        setFloatingPolicy(null);
        setShowPaymentModal(false);
        setShowComparePaymentModal(false);
        setHasSeenComparePaymentModal(false);
        setShowChatHistorySidebar(false);
        
        // Always navigate to home screen
        navigateTo('home');
        break;
      case 'uploadDocument': // New case for upload screen (single general upload)
          navigateTo('home'); // Go back to the home screen after upload
          break;
      case 'payment': // New case for payment screen
          navigateTo('policyAdvisorChat'); // Go back to chat screen
          break;
      case 'signUp':
        navigateTo('home');
        break;
      case 'login':
        navigateTo('home');
        break;
      default:
        navigateTo('home'); // Fallback to home screen
    }
  };
  
  // Handle close button click in TopBar
  const handleCloseClick = () => {
    if (currentScreen === 'policyAdvisorChat') {
      // Close all side panels
      setShowMenuSidePanel(false);
      setExpandedFeatureCategory(null);
      setShowSingleComparison(false);
      setShowChatPolicyFeaturesDropdown(false);
      setShowPaymentModal(false);
      setShowComparePaymentModal(false);
      setShowChatHistorySidebar(false);
    }
  };
  
  // UPDATED: handleCompareClick function to remove highlight when any compare button is clicked
  const handleCompareClick = (policyObjectToCompare) => {
    // If the policy being compared is the same as the current policyForAdvice, 
    // reset the policyForAdvice state to remove the highlight
    if (policyForAdvice && policyForAdvice.id === policyObjectToCompare.id) {
      setPolicyForAdvice(null);
    }
    
    // Then proceed with the existing comparison logic
    setPoliciesToCompare(prev => {
        const isAlreadySelected = prev.some(p => p.id === policyObjectToCompare.id);
        if (isAlreadySelected) {
            const newList = prev.filter(p => p.id !== policyObjectToCompare.id);
            setComparisonFeedback(newList.length > 0 ? `${newList.length} policy(s) selected.` : '');
            return newList;
        } else {
            // Allow up to 5 policies for comparison
            if (prev.length < 5) {
                const newList = [...prev, policyObjectToCompare];
                setComparisonFeedback(`${newList.length} policy(s) selected.`);
                return newList;
            } else {
                setComparisonFeedback("You can compare a maximum of 5 policies. Please deselect one to add another.");
                return prev;
            }
        }
    });
  };
  
  const handleClearComparison = () => {
      setPoliciesToCompare([]);
      setComparisonFeedback('');
      setShowSingleComparison(false);
  };
  
  const handleChatWithPoliciesContext = (policies, uploadedDocName = null, preservePolicies = false, customMessage = null) => { // Renamed function and added uploadedDocName
        let message = customMessage; // Use custom message if provided
        
        // If no custom message, create one based on policies and uploaded document
        if (!message) {
            if (policies.length === 0) {
                message = `I'm looking for general advice on insurance policies. Can you help me?`;
            } else {
                // Format policy names with quotes for clickable rendering
                const policyNames = policies.map(p => `"${p.name}"`).join(', ');
                
                if (policies.length === 1 && uploadedDocName) {
                    message = `I would like to discuss comparing "${policies[0].name}" and my uploaded document "${uploadedDocName}". Can you help me understand the differences and recommend which one is better for my needs?`;
                } else if (policies.length === 1) {
                    message = `I would like to discuss "${policies[0].name}". Can you tell me more about its benefits and how it compares to other policies?`;
                } else if (uploadedDocName) {
                    message = `I would like to discuss comparing ${policyNames}, and my uploaded document "${uploadedDocName}". Can you help me understand the differences and recommend which one is better for my needs?`;
                } else {
                    // Add " Compare" at the end for the button
                    message = `I would like to discuss comparing ${policyNames}. Can you help me understand the differences and recommend which one is better for my needs? Compare`;
                }
            }
        }
        
        handleNewChat(policies, uploadedDocName); // Start a new chat with context
        handleNewMessage(message, 'user'); // Send the user's question
        navigateTo('policyAdvisorChat');
        
        // Only clear policies if not preserving them
        if (!preservePolicies) {
            setPoliciesToCompare([]);
            setUploadedPolicyFileName(null);
        }
    };
    
  // currentPolicy needs to be defined at the top level of the App component
  const currentPolicy = selectedPolicyId ? policiesData.find(p => p.id === selectedPolicyId) : null;
  
  // Handler for getting unbiased advice
  const handleGetAdvice = (policy) => {
    // Set the policy for advice highlighting
    setPolicyForAdvice(policy);
    setInitialPolicyForChat(policy);
    handleNewChat([], null, policy);
    navigateTo('policyAdvisorChat');
    // Ensure the side panel is closed
    setShowMenuSidePanel(false);
    
    // NEW: Set floating policy button
    setFloatingPolicy(policy);
  };
  
  // Handler for clicking policy name in chat
  const handlePolicyNameClick = (policy) => {
    // Set policies to compare to include only this policy
    setPoliciesToCompare([policy]);
    // Show single comparison panel in split view
    setShowSingleComparison(true);
    // Set floating policy button
    setFloatingPolicy(policy);
    // Close menu side panel if open
    setShowMenuSidePanel(false);
  };
  
  // Handler for going back to home from chat
  const handleBackToHome = () => {
    navigateTo('home');
  };
  
  // Handler for navigating to payment screen
  const handlePaymentScreenClick = () => {
    navigateTo('payment');
  };
  
  // Handler for successful payment
  const handlePaymentSuccess = () => {
    // Navigate back to chat with success message
    navigateTo('policyAdvisorChat');
    handleNewMessage("Payment successful! You now have access to premium policy comparison features. How would you like to proceed?", 'bot');
  };
  
  // Handler for feature clicks in comparison panel
  const handleFeatureClick = (feature) => {
    // Check if we have policies in comparison
    if (policiesToCompare && policiesToCompare.length > 0) {
      // If only one policy, set it as the active policy for chat
      if (policiesToCompare.length === 1) {
        setInitialPolicyForChat(policiesToCompare[0]);
      }
      // Navigate to chat if not already there
      if (currentScreen !== 'policyAdvisorChat') {
        navigateTo('policyAdvisorChat');
      }
    }
    // Send a message to the chat about this feature
    const message = `Can you tell me more about "${feature}"?`;
    handleNewMessage(message, 'user');
  };
  
  // Handler for feature icon clicks from TopBar
  const handleFeatureIconClick = (featureCategory) => {
    // Set the expanded feature category to open the side panel
    setExpandedFeatureCategory(featureCategory);
    
    // If we're not already on the chat screen, navigate to it
    if (currentScreen !== 'policyAdvisorChat') {
      navigateTo('policyAdvisorChat');
    }
  };
  
  // Handler for chat policy features button click
  const handleChatPolicyFeaturesClick = () => {
    setShowChatPolicyFeaturesDropdown(!showChatPolicyFeaturesDropdown);
  };
  
  // Handler for showing compare payment modal
  const handleShowComparePaymentModal = () => {
    setShowComparePaymentModal(true);
  };
  
  // Handler for compare payment option selection
  const handleComparePaymentOptionSelected = (option) => {
    setShowComparePaymentModal(false);
    
    if (option === 'free') {
      // For free option, show the split view comparison
      setShowSingleComparison(true);
    } else if (option === 'subscription') {
      // For subscription option, navigate to payment screen
      navigateTo('payment');
    }
  };
  
  // Handler for selecting a chat from history
  const handleSelectChat = (chatId) => {
    setCurrentChatId(chatId);
  };
  
  // Handler for toggling chat history sidebar
  const handleToggleChatHistorySidebar = () => {
    setShowChatHistorySidebar(!showChatHistorySidebar);
  };
  
  // Handler for mobile check my policy button click (swapped functionality)
  const handleMobileCheckMyPolicyClick = () => {
    // This now handles the Policy Features functionality in mobile
    setShowChatPolicyFeaturesDropdown(!showChatPolicyFeaturesDropdown);
  };
  
  // Handler for mobile policy features button click (swapped functionality)
  const handleMobilePolicyFeaturesClick = () => {
    // This now handles the Check My Policy functionality in mobile
    handleMenuClick();
  };
  
  // Renders the appropriate screen component based on currentScreen state
  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        return (
          <HomeScreen
            onCheckMyPolicyClick={handleCheckMyPolicyFromHome}
            onExplorePolicyTypesClick={handleExplorePolicyTypesFromHome}
          />
        );
      case 'signUp':
        return <SignUpScreen onBack={handleBackClick} onLoginClick={() => navigateTo('login')} />;
      case 'policyAdvisorChat':
        const currentChatData = chatHistories.find(chat => chat.id === currentChatId);
        return (
          <div className="flex h-full w-full">
            <PolicyAdvisorChat
              messages={currentChatData ? currentChatData.messages : []}
              initialBotMessageText={getInitialBotMessageText(selectedPolicyType, policiesToCompare, uploadedPolicyFileName, selectedBudget)}
              onSendMessage={handleNewMessage}
              onMenuClick={handleMenuClick}
              selectedPolicyType={selectedPolicyType}
              setSelectedPolicyType={setSelectedPolicyType}
              selectedBudget={selectedBudget}
              setSelectedBudget={setSelectedBudget}
              policiesToCompare={policiesToCompare}
              onClearComparison={handleClearComparison}
              onCompareClick={handleCompareClick}
              initialPolicyForChat={initialPolicyForChat}
              onPolicyNameClick={handlePolicyNameClick}
              onBackToHome={handleBackToHome}
              onGetAdvice={handleGetAdvice}
              onUploadDocument={() => navigateTo('uploadDocument')}
              comparisonFeedback={comparisonFeedback}
              showMenuSidePanel={showMenuSidePanel}
              setShowMenuSidePanel={setShowMenuSidePanel}
              onPaymentScreenClick={handlePaymentScreenClick}
              showSingleComparison={showSingleComparison}
              setShowSingleComparison={setShowSingleComparison}
              onFeatureClick={handleFeatureClick}
              expandedFeatureCategory={expandedFeatureCategory}
              setExpandedFeatureCategory={setExpandedFeatureCategory}
              policiesData={policiesData}  // Pass policiesData
              showChatPolicyFeaturesDropdown={showChatPolicyFeaturesDropdown}
              setShowChatPolicyFeaturesDropdown={setShowChatPolicyFeaturesDropdown}
              floatingPolicy={floatingPolicy} // Pass floating policy state
              onFloatingPolicyClick={handlePolicyNameClick} // Pass floating policy click handler
              showPaymentModal={showPaymentModal} // Pass payment modal state
              setShowPaymentModal={setShowPaymentModal} // Pass payment modal setter
              setPoliciesToCompare={setPoliciesToCompare} // Pass setPoliciesToCompare function
              showComparePaymentModal={showComparePaymentModal} // Pass compare payment modal state
              setShowComparePaymentModal={setShowComparePaymentModal} // Pass compare payment modal setter
              onComparePaymentOptionSelected={handleComparePaymentOptionSelected} // Pass compare payment option handler
              hasSeenComparePaymentModal={hasSeenComparePaymentModal} // Pass hasSeenComparePaymentModal state
              setHasSeenComparePaymentModal={setHasSeenComparePaymentModal} // Pass setHasSeenComparePaymentModal function
              showChatHistorySidebar={showChatHistorySidebar} // Pass chat history sidebar state
              setShowChatHistorySidebar={setShowChatHistorySidebar} // Pass chat history sidebar setter
              chatHistories={chatHistories} // Pass chat histories
              currentChatId={currentChatId} // Pass current chat ID
              onSelectChat={handleSelectChat} // Pass chat selection handler
              userSubscription={userSubscription} // Pass user subscription status
              onMobileCheckMyPolicyClick={handleMobileCheckMyPolicyClick} // Pass mobile check my policy handler
              onMobilePolicyFeaturesClick={handleMobilePolicyFeaturesClick} // Pass mobile policy features handler
            />
          </div>
        );
      case 'policyListing': // This case is now specifically for direct menu navigation
        return <PolicyListingScreen
          onBack={handleBackClick}
          onGetAdvice={handleGetAdvice}
          policyType={selectedPolicyType}
          onSelectPolicyType={setSelectedPolicyType}
          showCancelButton={false}
          onCancel={() => navigateTo('policyAdvisorChat')} // Go back to chat when cancel is clicked
          onUploadDocument={() => navigateTo('uploadDocument')} // Pass new handler
          onCompareClick={handleCompareClick}
          comparisonFeedback={comparisonFeedback}
          policiesToCompare={policiesToCompare}
          onClearComparison={handleClearComparison} // Pass clear comparison handler
          onInitiateSelectedComparison={(policies) => {
            // For comparison, go to chat with policies
            handleChatWithPoliciesContext(policies);
          }}
          policiesData={policiesData}  // Pass policiesData
        />;
      case 'policyDetails':
        return <PolicyDetailScreen
            policy={currentPolicy} // currentPolicy is now defined at App level
            onBack={handleBackClick}
            onTalkToAdvisor={(policy) => handleChatWithPoliciesContext([policy])} // Pass the policy to the new handler
            comparisonFeedback={comparisonFeedback}
            policiesToCompareCount={policiesToCompare.length}
        />;
      case 'uploadDocument': // New case for upload screen (single general upload)
        return <UploadDocumentScreen
            onBack={handleBackClick}
            onDocumentUpload={handleDocumentUploadSuccess}
        />;
      case 'payment': // New case for payment screen
        return <PaymentScreen
            policiesToCompare={policiesToCompare}
            onBack={handleBackClick}
            onPaymentSuccess={handlePaymentSuccess}
            onCancel={handleBackClick}
        />;
      case 'login':
        return <LoginScreen onBack={handleBackClick} onSignUpClick={() => navigateTo('signUp')} />;
      default:
        return <HomeScreen onCheckMyPolicyClick={handleCheckMyPolicyFromHome} onExplorePolicyTypesClick={handleExplorePolicyTypesFromHome} />;
    }
  };
  
  return (
    <div className="min-h-screen bg-white flex flex-col items-center font-inter text-gray-800">
      {/* Loading/Error Notifications */}
      {isLoadingPolicies && (
        <div className="fixed top-4 right-4 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          <span>Loading policies from backend...</span>
        </div>
      )}
      {apiError && (
        <div className="fixed top-4 right-4 bg-yellow-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          <span>{apiError}</span>
        </div>
      )}
      
      {/* Tailwind CSS CDN Script - This is now placed globally in the HTML for consistent loading */}
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          body { font-family: 'Inter', sans-serif; }
          /* Custom slider thumb styles */
          input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: var(--thumb-color);
            cursor: pointer;
            box-shadow: 0 0 2px rgba(0,0,0,0.3);
            margin-top: -8px; /* Center thumb vertically */
          }
          input[type="range"]::-moz-range-thumb {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: var('--thumb-color);
            cursor: pointer;
            box-shadow: 0 0 2px rgba(0,0,0,0.3);
          }
          /* Custom scrollbar for chat */
          .thin-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .thin-scrollbar::-webkit-scrollbar-track {
            background: #f1f1f1;
          }
          .thin-scrollbar::-webkit-scrollbar-thumb {
            background: #888;
            border-radius: 3px;
          }
          .thin-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #555;
          }
          /* Fade-out animation for success notification */
          @keyframes fade-out {
            0% { opacity: 1; }
            70% { opacity: 1; }
            100% { opacity: 0; }
          }
          .animate-fade-out {
            animation: fade-out 3s ease-in-out forwards;
          }
          /* Gemini response styling */
          .gemini-response {
            width: 100%;
          }
          .gemini-response h3 {
            font-size: 1.1rem;
            font-weight: 600;
            margin-top: 1rem;
            margin-bottom: 0.75rem;
            color: #1f2937;
          }
          .gemini-response p {
            margin-bottom: 1rem;
            line-height: 1.6;
          }
          /* Hide horizontal scrollbar */
          .hide-horizontal-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .hide-horizontal-scrollbar::-webkit-scrollbar {
            display: none;
          }
          /* Marquee animation for desktop suggested questions */
          @keyframes marquee {
            0% { transform: translateX(0%); }
            100% { transform: translateX(-50%); }
          }
          .animate-marquee {
            animation-name: marquee;
            animation-timing-function: linear;
            animation-iteration-count: infinite;
            animation-duration: 30s;
          }
          .group:hover .animate-marquee {
            animation-play-state: paused !important;
          }
        `}
      </style>
      
      {/* TopBar component, always rendered but conditionally shows elements */}
      <TopBar
        showBackButton={showBackButtonForScreen()}
        onBackClick={handleBackClick}
        title={getScreenTitle()}
        showAuthButtons={showAuthButtonsForScreen()}
        onLoginClick={() => navigateTo('login')}
        onSignUpClick={() => navigateTo('signUp')}
        isChatScreen={currentScreen === 'policyAdvisorChat'}
        onToggleChatSidebar={() => setIsChatSidebarOpen(prev => !prev)}
        onMenuClick={handleMenuClick}
        isDirectChatAccess={isDirectChatAccess}
        onFeatureIconClick={currentScreen === 'policyAdvisorChat' ? handleFeatureIconClick : undefined}
        showCloseButton={showCloseButtonForScreen()}
        onCloseClick={handleCloseClick}
        showPolicyFeaturesDropdown={showChatPolicyFeaturesDropdown}
        setShowPolicyFeaturesDropdown={setShowChatPolicyFeaturesDropdown}
        onDesktopFeatureClick={handleDesktopFeatureClick}
        onChatPolicyFeaturesClick={handleChatPolicyFeaturesClick}
        onToggleChatHistorySidebar={handleToggleChatHistorySidebar}
        onMobileCheckMyPolicyClick={currentScreen === 'policyAdvisorChat' ? handleMobileCheckMyPolicyClick : undefined}
        onMobilePolicyFeaturesClick={currentScreen === 'policyAdvisorChat' ? handleMobilePolicyFeaturesClick : undefined}
      />
      
      {/* Main content area, adjusts margin-top to account for the fixed TopBar and handles scrolling */}
      <div className={`flex-grow w-full mt-14 sm:mt-16 flex flex-col ${
          currentScreen === 'policyAdvisorChat' && isChatSidebarOpen ? 'ml-0 sm:ml-64' : ''
      } ${
          currentScreen !== 'policyAdvisorChat' ? 'p-2 sm:p-4 md:p-6 lg:p-8' : 'h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)]' // Increased height for chat screen
      }`}>
        {renderScreen()}
      </div>
    </div>
  );
};

export default App;