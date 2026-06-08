import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://code-gravity.onrender.com';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('codegravity_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const apiService = {
  login: async (email, password) => {
    try {
      const response = await apiClient.post('/login', { email, password });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Login failed');
    }
  },

  register: async (username, email, password) => {
    try {
      const response = await apiClient.post('/register', { username, email, password });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Registration failed');
    }
  },

  googleLogin: async (credential) => {
    try {
      const response = await apiClient.post('/auth/google', { credential });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Google Login failed');
    }
  },

  saveSubmission: async (submissionData) => {
    try {
      const response = await apiClient.post('/submissions', submissionData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to save submission');
    }
  },

  getSubmissions: async () => {
    try {
      const response = await apiClient.get('/submissions');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to fetch submissions');
    }
  },

  getUserProfile: async () => {
    try {
      const response = await apiClient.get('/profile');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to fetch user profile');
    }
  },

  updateUserProfile: async (profileData) => {
    try {
      const response = await apiClient.put('/profile', profileData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to update user profile');
    }
  },

  getPublicProfile: async (username) => {
    try {
      const response = await apiClient.get(`/profile/${username}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to fetch public profile details');
    }
  },

  toggleFollowUser: async (username) => {
    try {
      const response = await apiClient.post(`/profile/${username}/follow`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to toggle follow status');
    }
  },

  getLeaderboard: async () => {
    try {
      const response = await apiClient.get('/leaderboard');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to fetch leaderboard');
    }
  },

  /**
   * Execute code on isolated sandbox backend via Judge0
   * @param {string} code Source code written in Monaco
   * @param {string} language Language key (python, javascript, cpp, java)
   * @param {string} stdin Optional inputs to stdin console
   * @param {string} problemId Active problem ID to append tests runner driver
   * @returns {Promise<object>} Returns run metrics, stdout, stderr and status
   */
  runCode: async (code, language, stdin = '', problemId = '') => {
    try {
      const response = await apiClient.post('/run-code', {
        code,
        language,
        stdin,
        problem_id: problemId,
      });
      return response.data;
    } catch (error) {
      console.error('API Service runCode error:', error);
      return {
        error: true,
        message: error.response?.data?.detail || 'Failed to establish connection with local sandboxed compiler server. Please ensure the backend is running.',
        time: '0.0ms',
        memory: '0 KB',
      };
    }
  },

  /**
   * Submit code and evaluate strictly against testcases via backend
   * @param {string} code Source code
   * @param {string} language Language key
   * @param {string} problemId Problem ID
   * @param {Array} testcases Array of test cases
   * @returns {Promise<object>} Returns structured verdict and testcase evaluations
   */
  submitCode: async (code, language, problemId, testcases) => {
    try {
      const response = await apiClient.post('/submit-code', {
        code,
        language,
        problem_id: problemId,
        testcases,
      });
      return response.data;
    } catch (error) {
      console.error('API Service submitCode error:', error);
      return {
        verdict: "Server Error",
        error: true,
        message: error.response?.data?.detail || 'Failed to establish connection with backend validation engine.',
        time: '0.0ms',
        memory: '0 KB',
      };
    }
  },

  getDiscussions: async (problemId) => {
    try {
      const response = await apiClient.get(`/problems/${problemId}/discussions`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to fetch discussions');
    }
  },

  createDiscussion: async (problemId, discussionData) => {
    try {
      const response = await apiClient.post(`/problems/${problemId}/discussions`, discussionData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to post discussion');
    }
  },

  getDiscussionThread: async (discussionId) => {
    try {
      const response = await apiClient.get(`/discussions/${discussionId}/thread`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to fetch discussion thread');
    }
  },

  upvoteDiscussion: async (discussionId) => {
    try {
      const response = await apiClient.post(`/discussions/${discussionId}/upvote`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to upvote discussion');
    }
  },

  resolveDiscussion: async (discussionId) => {
    try {
      const response = await apiClient.post(`/discussions/${discussionId}/resolve`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to resolve discussion');
    }
  },

  createComment: async (discussionId, commentData) => {
    try {
      const response = await apiClient.post(`/discussions/${discussionId}/comments`, commentData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to post comment');
    }
  },

  upvoteComment: async (commentId) => {
    try {
      const response = await apiClient.post(`/comments/${commentId}/upvote`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to upvote comment');
    }
  },

  markCommentHelpful: async (commentId) => {
    try {
      const response = await apiClient.post(`/comments/${commentId}/helpful`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to toggle helpful flag');
    }
  },

  createReply: async (commentId, replyData) => {
    try {
      const response = await apiClient.post(`/comments/${commentId}/replies`, replyData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to post reply');
    }
  },

  deleteDiscussion: async (discussionId) => {
    try {
      const response = await apiClient.delete(`/discussions/${discussionId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to delete discussion');
    }
  },

  deleteComment: async (commentId) => {
    try {
      const response = await apiClient.delete(`/comments/${commentId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to delete comment');
    }
  },
};
