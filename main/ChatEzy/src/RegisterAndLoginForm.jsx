import { useContext, useState } from "react";
import axios from "axios";
import { UserContext } from "./UserContext.jsx";

axios.defaults.baseURL = 'http://localhost:4040'; 
axios.defaults.withCredentials = true;

export default function RegisterAndLoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginOrRegister, setIsLoginOrRegister] = useState('login');
  const [errorMessage, setErrorMessage] = useState('');
  const { setUsername: setLoggedInUsername, setId } = useContext(UserContext);

  async function handleSubmit(ev) {
    ev.preventDefault();
    const url = isLoginOrRegister === 'register' ? '/register' : '/login';
    try {
      const { data } = await axios.post(url, { username, password });
      setLoggedInUsername(username);
      setId(data.id);
      setErrorMessage('');
    } catch (error) {
      console.error("There has been a problem with your axios request:", error);
      if (error.response && error.response.status === 401) {
        setErrorMessage('Invalid username or password');
      } else {
        setErrorMessage('Invalid Login Credentials. Please try again.');
      }
    }
  }

  async function sendMessage(recipient, message) {
    try {
      const { data } = await axios.post('/send-message', { recipient, text: message });
      console.log('Message sent:', data);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  return (
    <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-screen flex items-center justify-center relative">
      <div className="absolute top-16 text-center w-full bounce-animation">
        <h1 className="text-white text-4xl font-bold">Welcome to Chat-EZ!</h1>
      </div>
      <div className="absolute top-0 left-0 p-4 flex items-center gap-2 text-white font-extrabold text-2xl shadow-lg rounded-md bg-blue-700 bg-opacity-75 p-3">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
          <path d="M4.913 2.658c2.075-.27 4.19-.408 6.337-.408 2.147 0 4.262.139 6.337.408 1.922.25 3.291 1.861 3.405 3.727a4.403 4.403 0 00-1.032-.211 50.89 50.89 0 00-8.42 0c-2.358.196-4.04 2.19-4.04 4.434v4.286a4.47 4.47 0 002.433 3.984L7.28 21.53A.75.75 0 016 21v-4.03a48.527 48.527 0 01-1.087-.128C2.905 16.58 1.5 14.833 1.5 12.862V6.638c0-1.97 1.405-3.718 3.413-3.979z" />
          <path d="M15.75 7.5c-1.376 0-2.739.057-4.086.169C10.124 7.797 9 9.103 9 10.609v4.285c0 1.507 1.128 2.814 2.67 2.94 1.243.102 2.5.157 3.768.165l2.782 2.781a.75.75 0 001.28-.53v-2.39l.33-.026c1.542-.125 2.67-1.433 2.67-2.94v-4.286c0-1.505-1.125-2.811-2.664-2.94A49.392 49.392 0 0015.75 7.5z" />
        </svg>
        Chat-EZ
      </div>
      <form className="w-80 p-8 bg-gradient-to-r from-teal-200 to-blue-200 rounded-lg shadow-lg" onSubmit={handleSubmit}>
        <h1 className="text-2xl font-bold mb-4 text-center text-gray-700">{isLoginOrRegister === 'register' ? 'Register' : 'Login'}</h1>
        <input
          value={username}
          onChange={(ev) => setUsername(ev.target.value)}
          type="text"
          placeholder="Username"
          className="block w-full rounded-sm p-2 mb-4 border border-gray-300 focus:outline-none focus:border-blue-500"
        />
        <input
          value={password}
          onChange={(ev) => setPassword(ev.target.value)}
          type="password"
          placeholder="Password"
          className="block w-full rounded-sm p-2 mb-4 border border-gray-300 focus:outline-none focus:border-blue-500"
        />
        <button className="bg-blue-500 hover:bg-blue-600 text-white block w-full rounded-sm p-2 transition duration-200">
          {isLoginOrRegister === 'register' ? 'Register' : 'Login'}
        </button>
        {errorMessage && (
          <div className="text-red-500 text-center mt-4">
            {errorMessage}
          </div>
        )}
        <div className="text-center mt-4 text-gray-700">
          {isLoginOrRegister === 'register' ? (
            <div>
              Already a member?
              <button
                type="button"
                className="ml-1 underline text-blue-500"
                onClick={() => setIsLoginOrRegister('login')}
              >
                Login here
              </button>
            </div>
          ) : (
            <div>
              Don't have an account?
              <button
                type="button"
                className="ml-1 underline text-blue-500"
                onClick={() => setIsLoginOrRegister('register')}
              >
                Register
              </button>
            </div>
          )}
        </div>
      </form>
      <style jsx>{`
        .bounce-animation {
          animation: bounce 1s infinite;
        }

        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
      `}</style>
    </div>
  );
}
