export async function trackPass(passData) {
  if (!passData?.name || !passData?.email || !passData?.pass_number) {
    throw new Error('Missing required fields: name, email, or pass number');
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(passData.email)) {
    throw new Error('Invalid email format');
  }

  const response = await fetch('/api/track-pass', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(passData)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || response.statusText);
  }

  return response.json();
}

export async function fetchPasses(params = {}) {
  const searchParams = new URLSearchParams(params);
  const url = searchParams.toString()
    ? `/api/get-passes?${searchParams.toString()}`
    : '/api/get-passes';

  const response = await fetch(url);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || response.statusText);
  }

  const payload = await response.json();
  if (Array.isArray(payload)) {
    return payload;
  }
  if (Array.isArray(payload?.data)) {
    return payload.data;
  }
  return [];
}

export async function createCheckoutSession(payload) {
  const response = await fetch('/api/create-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || response.statusText);
  }

  return response.json();
}
