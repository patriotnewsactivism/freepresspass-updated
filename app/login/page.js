'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmedUser = username.trim();

    if (trimmedUser === 'admin' && password === 'freepresspass2025') {
      localStorage.setItem('adminLoggedIn', 'true');
      router.push('/admin');
    } else {
      setError('Invalid username or password.');
    }
  };

  return (
    <div className="admin-login-container">
      <h1>Admin Login</h1>
      <form id="loginForm" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">Username:</label>
          <input
            type="text"
            id="username"
            name="username"
            required
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setError('');
            }}
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            name="password"
            required
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError('');
            }}
          />
        </div>
        <button type="submit">Login</button>
      </form>
      {error ? (
        <p id="login-error" className="error-message" style={{ display: 'block', color: 'red', marginTop: '1rem' }}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
