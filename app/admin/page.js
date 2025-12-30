'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchPasses } from '../../lib/api';

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function parseUserAgent(ua) {
  if (!ua || ua === 'Unknown') return 'Unknown';

  let browser = 'Unknown';
  if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Safari')) browser = 'Safari';
  else if (ua.includes('Edge')) browser = 'Edge';

  let os = 'Unknown';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'Mac';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  return `${browser} on ${os}`;
}

function calculateStats(passes) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  let total = passes.length;
  let monthly = 0;
  let todayCount = 0;
  const domains = new Set();

  passes.forEach((pass) => {
    const issuedDate = new Date(pass.created_at);
    if (issuedDate >= thisMonth) {
      monthly++;
    }
    if (issuedDate >= today) {
      todayCount++;
    }
    const domain = (pass.email || '').split('@')[1];
    if (domain) domains.add(domain);
  });

  return { total, monthly, todayCount, uniqueDomains: domains.size };
}

export default function AdminPage() {
  const router = useRouter();
  const [passes, setPasses] = useState([]);
  const [filteredPasses, setFilteredPasses] = useState([]);
  const [stats, setStats] = useState({ total: 0, monthly: 0, todayCount: 0, uniqueDomains: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortColumn, setSortColumn] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');

  const loadPasses = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await fetchPasses({ sortBy: 'created_at', sortOrder: 'desc', limit: '1000' });
      setPasses(data);
      setStats(calculateStats(data));
    } catch (err) {
      setError(`Error loading passes: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem('adminLoggedIn') !== 'true') {
      router.push('/login');
      return;
    }
    loadPasses();
  }, [router]);

  useEffect(() => {
    let filtered = [...passes];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((pass) => {
        return (
          (pass.name || '').toLowerCase().includes(term) ||
          (pass.email || '').toLowerCase().includes(term) ||
          (pass.pass_number || '').toLowerCase().includes(term) ||
          (pass.title || '').toLowerCase().includes(term)
        );
      });
    }

    if (dateFilter !== 'all') {
      const now = new Date();
      let filterDate;

      switch (dateFilter) {
        case 'today':
          filterDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          filterDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          filterDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          filterDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          filterDate = null;
      }

      if (filterDate) {
        filtered = filtered.filter((pass) => {
          const passDate = new Date(pass.created_at);
          return passDate >= filterDate;
        });
      }
    }

    filtered.sort((a, b) => {
      let aVal = a[sortColumn] || '';
      let bVal = b[sortColumn] || '';

      if (sortColumn === 'created_at') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredPasses(filtered);
  }, [passes, searchTerm, dateFilter, sortColumn, sortDirection]);

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Title', 'Pass Number', 'Date Issued', 'IP Address', 'User Agent'];
    const rows = filteredPasses.map((pass) => [
      pass.name || '',
      pass.email || '',
      pass.title || '',
      pass.pass_number || '',
      formatDate(pass.created_at),
      pass.ip_address || '',
      pass.user_agent || ''
    ]);

    let csv = `${headers.join(',')}\n`;
    rows.forEach((row) => {
      csv += row.map((cell) => `"${cell}"`).join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `press-passes-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const sortIndicator = (column) => {
    if (sortColumn !== column) return '-';
    return sortDirection === 'asc' ? '^' : 'v';
  };

  return (
    <>
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <button
          id="logout"
          className="logout-button"
          onClick={() => {
            localStorage.removeItem('adminLoggedIn');
            router.push('/login');
          }}
        >
          Logout
        </button>
      </div>

      <div className="admin-container">
        <section className="stats">
          <div className="stat-card">
            <h3>Total Passes</h3>
            <div className="stat-value" id="totalPasses">
              {stats.total}
            </div>
          </div>
          <div className="stat-card">
            <h3>Passes This Month</h3>
            <div className="stat-value" id="monthlyPasses">
              {stats.monthly}
            </div>
          </div>
          <div className="stat-card">
            <h3>Unique Email Domains</h3>
            <div className="stat-value" id="uniqueEmails">
              {stats.uniqueDomains}
            </div>
          </div>
          <div className="stat-card">
            <h3>Today's Passes</h3>
            <div className="stat-value" id="todayPasses">
              {stats.todayCount}
            </div>
          </div>
        </section>

        <div className="controls">
          <input
            type="text"
            id="searchInput"
            placeholder="Search by name, email, or pass number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select id="dateFilter" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
          <button id="exportCSV" onClick={exportToCSV}>
            Export to CSV
          </button>
          <button id="refreshData" onClick={loadPasses}>
            Refresh Data
          </button>
        </div>

        <section className="passes-table">
          <h2>Issued Press Passes</h2>
          {loading ? <div id="loadingMessage" className="loading-message">Loading passes...</div> : null}
          {error ? (
            <div id="errorMessage" className="error">
              {error}
            </div>
          ) : null}
          {!loading && !error ? (
            <table id="passesTable" className="pass-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('name')}>Name {sortIndicator('name')}</th>
                  <th onClick={() => handleSort('email')}>Email {sortIndicator('email')}</th>
                  <th onClick={() => handleSort('title')}>Title {sortIndicator('title')}</th>
                  <th onClick={() => handleSort('pass_number')}>Pass Number {sortIndicator('pass_number')}</th>
                  <th onClick={() => handleSort('created_at')}>Date Issued {sortIndicator('created_at')}</th>
                  <th onClick={() => handleSort('ip_address')}>IP Address {sortIndicator('ip_address')}</th>
                  <th onClick={() => handleSort('user_agent')}>Device {sortIndicator('user_agent')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredPasses.map((pass) => (
                  <tr key={pass.id || pass.pass_number}>
                    <td>{pass.name || 'N/A'}</td>
                    <td>{pass.email || 'N/A'}</td>
                    <td>{pass.title || 'N/A'}</td>
                    <td>{pass.pass_number || 'N/A'}</td>
                    <td>{formatDate(pass.created_at)}</td>
                    <td>{pass.ip_address || 'N/A'}</td>
                    <td title={pass.user_agent || 'Unknown'}>{parseUserAgent(pass.user_agent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </section>
      </div>
    </>
  );
}
