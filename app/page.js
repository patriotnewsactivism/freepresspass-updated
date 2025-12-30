'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Script from 'next/script';
import { createCheckoutSession, fetchPasses, trackPass } from '../lib/api';
import { drawPressPass, genPassId } from '../lib/pass';

const DEFAULT_NAME = 'YOUR NAME HERE';
const DEFAULT_TITLE = 'Investigative Journalist';

export default function HomePage() {
  const searchParams = useSearchParams();
  const canvasRef = useRef(null);
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [email, setEmail] = useState('');
  const [photoSrc, setPhotoSrc] = useState(null);
  const [passId, setPassId] = useState(null);
  const [notification, setNotification] = useState(null);
  const [errors, setErrors] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  useEffect(() => {
    drawPressPass(canvasRef.current, {
      name: name || DEFAULT_NAME,
      title: title || DEFAULT_TITLE,
      photoSrc,
      passId: passId || 'PREVIEW'
    });
  }, [name, title, photoSrc, passId]);

  useEffect(() => {
    const regenerateId = searchParams.get('regenerate');
    if (!regenerateId) return;

    const loadPass = async () => {
      try {
        const matches = await fetchPasses({ pass_number: regenerateId, limit: '1' });
        const pass = matches.find((item) => item.pass_number === regenerateId);
        if (pass) {
          setName(pass.name || '');
          setTitle(pass.title || '');
          setEmail(pass.email || '');
          setPassId(pass.pass_number || regenerateId);
          showNotification('Press pass loaded from the database.', 'info');
        } else {
          showNotification('Press pass not found in the database.', 'error');
        }
      } catch (error) {
        showNotification(`Unable to load press pass: ${error.message}`, 'error');
      }
    };

    loadPass();
  }, [searchParams]);

  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => setNotification(null), 5000);
    return () => clearTimeout(timer);
  }, [notification]);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
  };

  const validateEmail = (value) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(value);
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!name.trim()) {
      nextErrors.name = 'Full name is required.';
    }

    if (!title.trim()) {
      nextErrors.title = 'Organization name is required.';
    }

    if (!email.trim()) {
      nextErrors.email = 'Email is required.';
    } else if (!validateEmail(email.trim())) {
      nextErrors.email = 'Please enter a valid email address.';
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      showNotification('Please complete all required fields.', 'error');
      return false;
    }

    return true;
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      setPhotoSrc(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoSrc(e.target.result);
    };
    reader.onerror = () => {
      showNotification('Error reading file. Please try another photo.', 'error');
      setPhotoSrc(null);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!validateForm()) return;

    setIsGenerating(true);
    const newPassId = genPassId();
    setPassId(newPassId);

    try {
      await trackPass({
        name: name.trim(),
        title: title.trim(),
        email: email.trim(),
        pass_number: newPassId
      });
      showNotification('Press pass generated and saved successfully!', 'success');
    } catch (err) {
      showNotification(
        `Press pass generated, but NOT saved to the database: ${err.message}`,
        'error'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCheckout = async () => {
    if (!validateForm()) return;

    setIsCheckingOut(true);
    const newPassId = genPassId();
    setPassId(newPassId);

    try {
      const { url } = await createCheckoutSession({
        quantity: 1,
        passId: newPassId,
        name: name.trim(),
        email: email.trim(),
        title: title.trim()
      });

      if (!url) {
        throw new Error('Unable to start checkout.');
      }

      window.location.href = url;
    } catch (err) {
      showNotification(err.message || 'Checkout failed. Please try again.', 'error');
      setIsCheckingOut(false);
    }
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = 'press-pass.png';
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  const handleOpenImage = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL('image/png');
    window.open(dataUrl, '_blank');
  };

  const notificationStyle = useMemo(() => {
    if (!notification) return {};
    const colors = {
      success: '#4CAF50',
      error: '#F44336',
      info: '#2196F3'
    };
    return {
      display: 'block',
      opacity: 1,
      backgroundColor: colors[notification.type] || colors.success
    };
  }, [notification]);

  return (
    <>
      <Script id="structured-data" type="application/ld+json" strategy="afterInteractive">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'Free Press Pass Generator',
          description:
            'Generate your digital press pass for journalism activities. Get recognized under First Amendment protections with our Constitutional Press accreditation.',
          url: 'https://freepresspass.com',
          applicationCategory: 'Government',
          operatingSystem: 'All',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD'
          }
        })}
      </Script>

      <header>
        <h1>FREE PRESS PASS</h1>
      </header>

      <section className="tagline-section">
        <p>
          This press pass generator is brought to you by <strong>Leroy Truth Investigations</strong> and{' '}
          <strong>The Exposure Report</strong>.
        </p>
        <div className="channel-links">
          <a href="https://www.youtube.com/@leroytruth" target="_blank" rel="noopener noreferrer">
            Leroy Truth Investigations on YouTube
          </a>
          <span className="separator">&nbsp;|&nbsp;</span>
          <a
            href="https://www.youtube.com/@theexposurereport"
            target="_blank"
            rel="noopener noreferrer"
          >
            The Exposure Report on YouTube
          </a>
        </div>
      </section>

      <main role="main">
        <div className="container">
          <div className="form-section">
            <h2>Generate Your Press Pass</h2>
            <form id="passForm" onSubmit={(e) => e.preventDefault()}>
              <div className="form-group">
                <label htmlFor="name">Full Name:</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setErrors((prev) => ({ ...prev, name: '' }));
                  }}
                  style={{ borderColor: errors.name ? 'red' : undefined }}
                />
                <div className="error-message" id="name-error">
                  {errors.name || ''}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="title">Organization Name (if applicable):</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  required
                  placeholder="Your organization name (if applicable)"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setErrors((prev) => ({ ...prev, title: '' }));
                  }}
                  style={{ borderColor: errors.title ? 'red' : undefined }}
                />
                <div className="error-message" id="title-error">
                  {errors.title || ''}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address:</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => {
                    const value = e.target.value;
                    setEmail(value);
                    if (!value.trim()) {
                      setErrors((prev) => ({ ...prev, email: 'Email is required.' }));
                    } else if (!validateEmail(value.trim())) {
                      setErrors((prev) => ({ ...prev, email: 'Please enter a valid email address.' }));
                    } else {
                      setErrors((prev) => ({ ...prev, email: '' }));
                    }
                  }}
                  style={{ borderColor: errors.email ? 'red' : undefined }}
                />
                <div className="error-message" id="email-error">
                  {errors.email || ''}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="photo">Add Photo:</label>
                <input type="file" id="photo" name="photo" accept="image/*" onChange={handlePhotoChange} />
                {photoSrc ? (
                  <div id="photo-preview" style={{ marginTop: '1rem' }}>
                    <img
                      id="preview-image"
                      src={photoSrc}
                      alt="Press pass photo preview"
                      style={{ maxWidth: '100%', maxHeight: '200px' }}
                    />
                  </div>
                ) : null}
              </div>

              <button type="button" id="generate" onClick={handleGenerate} disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <span className="spinner" /> Generating...
                  </>
                ) : (
                  <>
                    Generate <strong>FREE</strong> Press Pass Now
                  </>
                )}
              </button>
              <button type="button" id="checkout" onClick={handleCheckout} disabled={isCheckingOut}>
                {isCheckingOut ? 'Processing...' : 'Enhanced/Laminated Version $15'}
              </button>
            </form>
          </div>

          <div className="preview-section">
            <h2>Press Pass Preview</h2>
            <canvas id="passCanvas" width={400} height={600} ref={canvasRef} />
            <div className="actions">
              <button id="download" onClick={handleDownload}>
                Download
              </button>
              <button id="openImage" onClick={handleOpenImage}>
                Open Image
              </button>
            </div>
          </div>
        </div>

        <section className="courtesy-section">
          <h2>Courtesy of Leroy Truth Investigations and The Exposure Report</h2>
          <p>Dedicated to the pursuit of truth and the protection of constitutional freedoms</p>
        </section>
        <section className="follow-section">
          <div className="follow-buttons">
            <a href="https://www.youtube.com/@leroytruth" target="_blank" rel="noopener noreferrer">
              Leroy Truth Investigations
            </a>
            <a href="https://www.youtube.com/@theexposurereport" target="_blank" rel="noopener noreferrer">
              The Exposure Report
            </a>
          </div>
        </section>

        <section className="info-section">
          <div className="info-card">
            <h3>What Is Press &amp; Journalism?</h3>
            <h4>Definition of "Press"</h4>
            <p>
              <strong>The Press</strong> refers to news media organizations, journalists, and individuals who gather,
              verify, and disseminate information to the public. This includes traditional newspapers, television
              news, radio journalism, digital publications, independent journalists, bloggers, podcasters, and
              citizen journalists who report on matters of public interest.
            </p>
            <p>
              The press serves as a crucial check on government power and provides citizens with the information
              necessary for democratic participation. The term encompasses both institutional media organizations
              and individual journalists working independently.
            </p>
          </div>
          <div className="info-card">
            <h3>Definition of "Journalist"</h3>
            <p>
              <strong>A Journalist</strong> is any person who regularly gathers, writes, edits, or disseminates news or
              information to the public. This includes:
            </p>
            <ul>
              <li>
                <strong>Traditional journalists</strong> employed by newspapers, magazines, television, or radio stations
              </li>
              <li>
                <strong>Freelance reporters</strong> who contribute to multiple publications
              </li>
              <li>
                <strong>Independent journalists</strong> who publish through their own platforms
              </li>
              <li>
                <strong>Citizen journalists</strong> who report on events in their communities
              </li>
              <li>
                <strong>Bloggers and podcasters</strong> who regularly cover news and current events
              </li>
              <li>
                <strong>Documentary filmmakers</strong> who investigate and report on issues of public concern
              </li>
            </ul>
          </div>
          <div className="info-card">
            <h3>First Amendment Protection</h3>
            <p>
              The First Amendment to the U.S. Constitution protects freedom of the press without requiring
              journalists to have special licenses, credentials, or formal training.{' '}
              <strong>
                Any person engaged in gathering and disseminating news to the public is entitled to press
                protections under the Constitution.
              </strong>
            </p>
            <p>
              Courts have consistently ruled that press freedom is not limited to traditional media outlets or
              credentialed journalists. The digital age has democratized journalism, and constitutional protections
              extend to all who perform the essential function of informing the public.
            </p>
          </div>
          <div className="info-card">
            <h3>Constitutional Foundation</h3>
            <p>
              In recognition of the fundamental principle enshrined in the First Amendment of the United States
              Constitution, which guarantees that "Congress shall make no law abridging the freedom of speech, or
              of the press," this initiative seeks to protect and empower independent journalists in their vital role
              as guardians of democracy.
            </p>
            <p>
              The Press Pass represents more than mere identification; it embodies the constitutional covenant
              between a free society and those who dedicate themselves to the pursuit of truth, the documentation of
              events, and the preservation of the historical record.
            </p>
            <h4>Our Mission</h4>
            <p>
              We believe that every citizen has the right to seek, receive, and share information. This press
              credential supports that fundamental right by providing independent journalists with a visible symbol
              of their constitutional protections. A robust and free press is essential to holding power accountable
              and ensuring an informed public.
            </p>
          </div>
        </section>
      </main>

      <div className="faq-section">
        <h2>Frequently Asked Questions</h2>
        <div className="faq-item">
          <h3>Is this press pass legally valid?</h3>
          <p>
            This digital press pass recognizes your rights under the First Amendment of the U.S. Constitution. While it
            doesn't replace official media credentials, it serves as a statement of your constitutional protections
            as a journalist.
          </p>
        </div>
        <div className="faq-item">
          <h3>How do I use this press pass?</h3>
          <p>
            Generate your pass using the form above, then download or open the image on your mobile device. You
            can present this digital pass when engaging in journalism activities to assert your First Amendment
            rights.
          </p>
        </div>
        <div className="faq-item">
          <h3>What's the difference between digital and laminated passes?</h3>
          <p>
            The digital pass is free and can be generated instantly. The laminated pass is a physical card that can
            be purchased for $15, which some may find more authoritative when presenting in person.
          </p>
        </div>
        <div className="faq-item">
          <h3>Do I need journalism experience to use this pass?</h3>
          <p>
            No experience is required. This pass recognizes your rights under the First Amendment, which protects
            all citizens' freedom of the press.
          </p>
        </div>
      </div>

      <div className="disclaimers">
        <h2>Legal Disclaimers</h2>
        <p>
          This digital press pass recognizes your rights under the First Amendment of the U.S. Constitution. While it serves as a statement of those protections, it does not replace official media credentials or
          provide legal immunity. The Constitutional Press Association is not liable for any legal issues that may
          arise from the use of this pass.
        </p>
        <p>
          For physical laminated passes, please note that they are provided as a convenience and do not confer
          additional legal protections beyond those of the digital version.
        </p>
      </div>

      <footer>
        <p>
          This journalist is recognized under the protections of the First Amendment of the U.S. Constitution. Any
          interference will be a violation of federal law.
        </p>
        <p>
          Do not hinder, exclude, or block the view of this journalist in the exercise of court-recognized First
          Amendment rights.
        </p>
      </footer>

      <div className="how-it-works">
        <h2>How It Works</h2>
        <ol>
          <li>Fill in your name and title in the form above</li>
          <li>Add a photo (optional but recommended)</li>
          <li>Click "Generate FREE Press Pass Now" to create your digital credential</li>
          <li>Download the pass or open it on mobile devices</li>
          <li>Present your pass when engaging in journalism activities</li>
        </ol>
      </div>

      <div className="about-section">
        <h2>About Constitutional Press</h2>
        <p>
          The Constitutional Press Association is dedicated to protecting and promoting First Amendment rights for
          all journalists, from professionals to citizen reporters. Our press pass serves as a tool to assert these
          constitutional protections.
        </p>
      </div>

      {notification ? (
        <div id="notification" style={notificationStyle}>
          {notification.message}
        </div>
      ) : null}
    </>
  );
}

