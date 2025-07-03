
import React, { useState, useCallback, useEffect } from 'react';
import { Page, TemplateId, Resume } from './types';
import Header from './components/Header';
import LandingPage from './components/pages/LandingPage';
import AuthPage from './components/pages/AuthPage';
import DashboardPage from './components/pages/DashboardPage';
import TemplateSelectionPage from './components/pages/TemplateSelectionPage';
import EditorPage from './components/pages/EditorPage';
import VerificationPage from './components/pages/VerificationPage';
import { initialResumeData } from './constants';
import { Amplify } from 'aws-amplify';
import { getCurrentUser, fetchUserAttributes, signOut } from 'aws-amplify/auth';

// Configure AWS Amplify for Cognito
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: 'eu-north-1_vd8WHRLeo',
      userPoolClientId: '6h176tl382h39nikene6reham0',
    },
  },
});

type User = {
  username: string;
  given_name?: string;
  family_name?: string;
  email?: string;
}

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.Landing);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [editingResume, setEditingResume] = useState<Resume | null>(null);
  const [verificationEmail, setVerificationEmail] = useState<string>('');
  
  const checkUser = useCallback(async () => {
    try {
      const cognitoUser = await getCurrentUser();
      const attributes = await fetchUserAttributes();
      setUser({ username: cognitoUser.username, ...attributes });
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      setIsAuthenticated(false);
      setUser(null);
      return false;
    }
  }, []);

  useEffect(() => {
    const initialCheck = async () => {
      await checkUser();
      setIsLoading(false);
    };
    initialCheck();
  }, [checkUser]);

  const handleLoginSuccess = useCallback(async () => {
    setIsLoading(true);
    const loggedIn = await checkUser();
    if(loggedIn) {
      setCurrentPage(Page.Dashboard);
    }
    setIsLoading(false);
  }, [checkUser]);

  const handleLogout = useCallback(async () => {
    try {
      await signOut();
      setIsAuthenticated(false);
      setUser(null);
      setCurrentPage(Page.Landing);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }, []);
  
  const navigateTo = useCallback((page: Page) => {
    setCurrentPage(page);
  }, []);

  const navigateToVerification = useCallback((email: string) => {
    setVerificationEmail(email);
    setCurrentPage(Page.Verification);
  }, []);

  const handleVerificationSuccess = useCallback(() => {
    // After verification, user needs to sign in.
    alert('Verification successful! Please sign in.');
    setCurrentPage(Page.Auth);
    setVerificationEmail('');
  }, []);

  const startNewResume = useCallback(() => {
    setCurrentPage(Page.TemplateSelection);
  }, []);

  const selectTemplate = useCallback((templateId: TemplateId) => {
    const newResume: Resume = {
      ...initialResumeData,
      id: crypto.randomUUID(),
      template: templateId,
      title: 'Untitled Resume',
    };
    setEditingResume(newResume);
    setCurrentPage(Page.Editor);
  }, []);

  const editResume = useCallback((resumeId: string) => {
      const resumeToEdit = resumes.find(r => r.id === resumeId);
      if (resumeToEdit) {
          setEditingResume(resumeToEdit);
          setCurrentPage(Page.Editor);
      }
  }, [resumes]);
function convertResumeToHtml(resume: Resume): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta http-equiv="x-pdfkit-font-embedding" content="none" />
        <title>${resume.title}</title>
        <style>
          body {
            font-family: sans-serif;
            margin: 0;
            padding: 40px;
            background: white;
            color: #333;
            line-height: 1.6;
            font-size: 14px;
          }
          h1, h2 {
            color: #2c3e50;
            margin-bottom: 12px;
          }
          section {
            margin-bottom: 24px;
          }
          .label {
            font-weight: bold;
          }
          ul {
            padding-left: 20px;
          }
        </style>
      </head>
      <body>
        <h1>${resume.title}</h1>

        <section>
          <h2>Personal Info</h2>
          <p><span class="label">Name:</span> ${resume.contact?.name || 'N/A'}</p>
          <p><span class="label">Email:</span> ${resume.contact?.email || 'N/A'}</p>
          <p><span class="label">Phone:</span> ${resume.contact?.phone || 'N/A'}</p>
          <p><span class="label">LinkedIn:</span> ${resume.contact?.linkedin || 'N/A'}</p>
          <p><span class="label">Website:</span> ${resume.contact?.website || 'N/A'}</p>
          <p><span class="label">Address:</span> ${resume.contact?.address || 'N/A'}</p>
        </section>

        <section>
          <h2>Summary</h2>
          <p>${resume.summary || 'No summary provided.'}</p>
        </section>

        <section>
          <h2>Skills</h2>
          <ul>
            ${(resume.skills || []).map(skill => `<li>${skill}</li>`).join('')}
          </ul>
        </section>

        <section>
          <h2>Experience</h2>
          ${(resume.experience || []).map(exp => `
            <div>
              <p><span class="label">Company:</span> ${exp.company}</p>
              <p><span class="label">Company:</span> ${exp.company}</p>
              <p>{experience.jobTitle}</p>
              <p><span class="label">From:</span> ${exp.startDate} - ${exp.endDate}</p>
              <p>${exp.description}</p>
            </div>
            <br />
          `).join('')}
        </section>

        <section>
          <h2>Education</h2>
          ${(resume.education || []).map(edu => `
            <div>
              <p><span class="label">School:</span> ${edu.school}</p>
              <p><span class="label">Degree:</span> ${edu.degree}</p>
            <p>{education.startDate} - {education.endDate}</p>>
            </div>
            <br />
          `).join('')}
        </section>
      </body>
    </html>
  `;
}



const saveResume = useCallback(async (updatedResume: Resume) => {
  // 1. Update local state
  setResumes(prevResumes => {
    const exists = prevResumes.some(r => r.id === updatedResume.id);
    if (exists) {
      return prevResumes.map(r => r.id === updatedResume.id ? updatedResume : r);
    }
    return [...prevResumes, updatedResume];
  });

  // Generate HTML from resume data
  const htmlContent = convertResumeToHtml(updatedResume);

  // 2. Save to AWS via Lambda
  try {
    const response = await fetch('https://3m5d3mmvnav5socucohi2xaf7a0twspi.lambda-url.us-east-1.on.aws/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user?.username || 'unknown-user',
        html: htmlContent,    // send HTML as required
      }),
    });

    const text = await response.text();
    let result;
    try {
      result = JSON.parse(text);
    } catch {
      result = { message: text };
    }

    if (!response.ok) {
      console.error('Lambda error:', result);
      throw new Error(result.message || 'Failed to save to Lambda');
    }

    console.log('✅ Saved to DynamoDB:', result);

  } catch (err) {
    if (err instanceof Error) {
      console.error('❌ Failed to save to AWS:', err);
      alert('Could not save resume to cloud: ' + err.message);
    } else {
      console.error('❌ Unknown error:', err);
      alert('Could not save resume to cloud: Unknown error');
    }
  }

  // 3. UI Navigation
  setEditingResume(null);
  setCurrentPage(Page.Dashboard);
}, [user]);


  const renderPage = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-[calc(100vh-64px)]">
          <p className="text-lg text-slate-500">Loading...</p>
        </div>
      );
    }

    if (isAuthenticated) {
      switch (currentPage) {
        case Page.Dashboard:
          return <DashboardPage resumes={resumes} onNewResume={startNewResume} onEditResume={editResume} />;
        case Page.TemplateSelection:
          return <TemplateSelectionPage onSelectTemplate={selectTemplate} />;
        case Page.Editor:
          if (editingResume) {
            return <EditorPage initialResume={editingResume} onSave={saveResume} onBack={() => setCurrentPage(Page.Dashboard)} />;
          }
          // Fallback if no resume is being edited, redirect to dashboard.
          setCurrentPage(Page.Dashboard);
          return <DashboardPage resumes={resumes} onNewResume={startNewResume} onEditResume={editResume} />;
        case Page.Landing:
        case Page.Auth:
        case Page.Verification:
        default:
          // Authenticated users on public/unknown pages are redirected to the dashboard.
          setCurrentPage(Page.Dashboard);
          return <DashboardPage resumes={resumes} onNewResume={startNewResume} onEditResume={editResume} />;
      }
    } else {
      // Unauthenticated users
      switch (currentPage) {
        case Page.Landing:
          return <LandingPage onNavigateToAuth={() => navigateTo(Page.Auth)} />;
        case Page.Auth:
          return <AuthPage onLoginSuccess={handleLoginSuccess} onNavigateToVerification={navigateToVerification} />;
        case Page.Verification:
          return <VerificationPage email={verificationEmail} onVerificationSuccess={handleVerificationSuccess} onBackToAuth={() => navigateTo(Page.Auth)} />;
        default:
          // Unauthenticated users on protected/unknown pages are redirected to the landing page.
          setCurrentPage(Page.Landing);
          return <LandingPage onNavigateToAuth={() => navigateTo(Page.Auth)} />;
      }
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800">
      <Header isAuthenticated={isAuthenticated} user={user} onLogout={handleLogout} onDashboardClick={() => navigateTo(Page.Dashboard)} />
      <main>
        {renderPage()}
      </main>
    </div>
  );
};

export default App;
