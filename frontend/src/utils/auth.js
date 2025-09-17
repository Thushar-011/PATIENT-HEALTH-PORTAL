export const getTokens = () => {
  try {
    const tokens = localStorage.getItem('tokens');
    return tokens ? JSON.parse(tokens) : null;
  } catch (error) {
    console.error("Failed to parse tokens from localStorage", error);
    return null;
  }
};

export const setTokens = (tokens) => {
  localStorage.setItem('tokens', JSON.stringify(tokens));
};

export const removeTokens = () => {
  localStorage.removeItem('tokens');
  localStorage.removeItem('user_id');
};

export const getUserId = () => {
  try {
    return localStorage.getItem('user_id');
  } catch (error) {
    console.error("Failed to get user ID from localStorage", error);
    return null;
  }
};