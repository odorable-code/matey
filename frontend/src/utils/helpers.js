export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('ko-KR');
};

export const formatTime = (date) => {
  return new Date(date).toLocaleTimeString('ko-KR');
};

export const getInitials = (name) => {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase();
};

export const truncateText = (text, length) => {
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
};

export const validateEmail = (email) => {
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(String(email).trim());
  return re
};
