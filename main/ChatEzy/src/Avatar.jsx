import React from 'react';

export default function Avatar({ userId, username, online }) {
  const colors = [
    'bg-blue-200', 'bg-green-200', 'bg-yellow-200',
    'bg-purple-200', 'bg-red-200', 'bg-teal-200',
    'bg-indigo-200', 'bg-pink-200', 'bg-orange-200', 'bg-cyan-200'
  ];

  // Calculate color index based on userId (assuming userId is provided)
  const userIdBase10 = userId ? parseInt(userId.substring(10), 16) : 0;
  const colorIndex = userIdBase10 % colors.length;
  const color = colors[colorIndex];

  return (
    <div className={`w-10 h-10 relative rounded-full flex items-center justify-center ${color}`}>
      <span className="text-white font-bold text-lg">{username ? username[0].toUpperCase() : '?'}</span>
      {online ? (
        <div className="absolute w-3 h-3 bg-green-500 bottom-0 right-0 rounded-full border-2 border-white"></div>
      ) : (
        <div className="absolute w-3 h-3 bg-gray-300 bottom-0 right-0 rounded-full border-2 border-white"></div>
      )}
    </div>
  );
}
