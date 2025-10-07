/**
 * Gemini API service for policy document analysis
 */

const GEMINI_API_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/gemini`;

class GeminiApiService {
  /**
   * Send a question about a specific policy to Gemini 2.5 Pro
   * @param {Object} policy - The selected policy object
   * @param {string} question - User's question
   * @param {Array} chatHistory - Previous chat messages
   * @returns {Promise<string>} - Gemini's response
   */
  static async askPolicyQuestion(policy, question, chatHistory = []) {
    try {
      const response = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
  }

  /**
   * Get policy document analysis
   * @param {Object} policy - The selected policy object
   * @returns {Promise<Object>} - Policy analysis
   */
  static async getPolicyAnalysis(policy) {
    try {
      const response = await fetch(`${GEMINI_API_URL}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          policy_id: policy.id,
          policy_name: policy.name,
          product_uin: policy.product_uin,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting policy analysis:', error);
      throw error;
    }
  }
}

export default GeminiApiService;

