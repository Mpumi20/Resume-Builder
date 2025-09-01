import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ResumeForm } from './components/ResumeForm';
import { ResumePreview } from './components/ResumePreview';
import { TemplateSelector } from './components/TemplateSelector';
import { ExportDialog } from './components/ExportDialog';
import { AuthForm } from './components/AuthForm';
import { UserProfile } from './components/UserProfile';
import { Button } from './components/ui/button';
import { Card } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Toaster } from './components/ui/sonner';
import { Popover, PopoverContent, PopoverTrigger } from './components/ui/popover';
import { Alert, AlertDescription } from './components/ui/alert';
import { 
  Download, 
  Eye, 
  Settings, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  User,
  Menu,
  LogIn,
  LogOut,
  UserPlus,
  Shield,
  Cloud,
  X
} from 'lucide-react';

export interface SkillItem {
  name: string;
  level: 1 | 2 | 3 | 4 | 5; // 1 = Beginner, 2 = Novice, 3 = Intermediate, 4 = Advanced, 5 = Expert
}

export interface ResumeData {
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    linkedIn: string;
    website: string;
    summary: string;
  };
  experience: Array<{
    id: string;
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    current: boolean;
    description: string;
    achievements: string[];
  }>;
  education: Array<{
    id: string;
    institution: string;
    degree: string;
    field: string;
    graduationYear: string;
    gpa?: string;
  }>;
  skills: {
    technical: SkillItem[];
    soft: SkillItem[];
    languages: SkillItem[];
  };
  projects: Array<{
    id: string;
    name: string;
    description: string;
    technologies: string[];
    link?: string;
  }>;
  certifications: Array<{
    id: string;
    name: string;
    issuer: string;
    date: string;
    link?: string;
  }>;
}

export type ResumeTemplate = 'professional' | 'modern' | 'creative';

interface User {
  email: string;
  name: string;
}

const initialResumeData: ResumeData = {
  personalInfo: {
    fullName: '',
    email: '',
    phone: '',
    location: '',
    linkedIn: '',
    website: '',
    summary: ''
  },
  experience: [],
  education: [],
  skills: {
    technical: [],
    soft: [],
    languages: []
  },
  projects: [],
  certifications: []
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [resumeData, setResumeData] = useState<ResumeData>(initialResumeData);
  const [selectedTemplate, setSelectedTemplate] = useState<ResumeTemplate>('professional');
  const [activeTab, setActiveTab] = useState('builder');
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [showGuestBanner, setShowGuestBanner] = useState(true);

  // Check authentication status on component mount
  useEffect(() => {
    const checkAuth = () => {
      const isAuth = localStorage.getItem('resumeBuilder_isAuthenticated') === 'true';
      const userData = localStorage.getItem('resumeBuilder_user');
      
      if (isAuth && userData) {
        try {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          setIsAuthenticated(true);
          setShowGuestBanner(false);
        } catch (error) {
          console.error('Error parsing user data:', error);
          // Clear invalid data
          localStorage.removeItem('resumeBuilder_isAuthenticated');
          localStorage.removeItem('resumeBuilder_user');
        }
      }
      
      // Check if user has dismissed guest banner
      const bannerDismissed = localStorage.getItem('resumeBuilder_guestBannerDismissed') === 'true';
      if (bannerDismissed) {
        setShowGuestBanner(false);
      }
      
      setLoading(false);
    };

    checkAuth();
  }, []);

  // Load resume data from localStorage on component mount (works for both guest and authenticated users)
  useEffect(() => {
    const storageKey = isAuthenticated ? 'resumeBuilderData' : 'resumeBuilderData_guest';
    const templateKey = isAuthenticated ? 'resumeBuilderTemplate' : 'resumeBuilderTemplate_guest';
    
    const savedData = localStorage.getItem(storageKey);
    const savedTemplate = localStorage.getItem(templateKey);
    
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        
        // Migrate old skills format to new format with ratings
        if (parsedData.skills) {
          Object.keys(parsedData.skills).forEach(category => {
            if (Array.isArray(parsedData.skills[category]) && 
                parsedData.skills[category].length > 0 && 
                typeof parsedData.skills[category][0] === 'string') {
              // Convert old string array to SkillItem array
              parsedData.skills[category] = parsedData.skills[category].map((skill: string) => ({
                name: skill,
                level: 3 // Default to intermediate level
              }));
            }
          });
        }
        
        setResumeData(parsedData);
      } catch (error) {
        console.error('Error loading saved resume data:', error);
      }
    }
    
    if (savedTemplate) {
      setSelectedTemplate(savedTemplate as ResumeTemplate);
    }
  }, [isAuthenticated]);

  // Save data to localStorage whenever resumeData changes (works for both guest and authenticated users)
  useEffect(() => {
    const storageKey = isAuthenticated ? 'resumeBuilderData' : 'resumeBuilderData_guest';
    localStorage.setItem(storageKey, JSON.stringify(resumeData));
  }, [resumeData, isAuthenticated]);

  // Save template to localStorage whenever selectedTemplate changes (works for both guest and authenticated users)
  useEffect(() => {
    const templateKey = isAuthenticated ? 'resumeBuilderTemplate' : 'resumeBuilderTemplate_guest';
    localStorage.setItem(templateKey, selectedTemplate);
  }, [selectedTemplate, isAuthenticated]);

  const handleAuthenticated = (userData: User) => {
    // If user was working as guest, offer to transfer data
    const guestData = localStorage.getItem('resumeBuilderData_guest');
    const guestTemplate = localStorage.getItem('resumeBuilderTemplate_guest');
    
    setUser(userData);
    setIsAuthenticated(true);
    setAuthDialogOpen(false);
    setShowGuestBanner(false);
    
    // Transfer guest data to authenticated account if it exists and user account is empty
    if (guestData) {
      const authenticatedData = localStorage.getItem('resumeBuilderData');
      if (!authenticatedData || authenticatedData === JSON.stringify(initialResumeData)) {
        localStorage.setItem('resumeBuilderData', guestData);
        if (guestTemplate) {
          localStorage.setItem('resumeBuilderTemplate', guestTemplate);
        }
        // Clear guest data after transfer
        localStorage.removeItem('resumeBuilderData_guest');
        localStorage.removeItem('resumeBuilderTemplate_guest');
      }
    }
  };

  const handleSignOut = () => {
    setUser(null);
    setIsAuthenticated(false);
    setProfileOpen(false);
    // Don't clear resume data - convert it to guest data
    const currentData = JSON.stringify(resumeData);
    const currentTemplate = selectedTemplate;
    localStorage.setItem('resumeBuilderData_guest', currentData);
    localStorage.setItem('resumeBuilderTemplate_guest', currentTemplate);
    // Clear authenticated data
    localStorage.removeItem('resumeBuilderData');
    localStorage.removeItem('resumeBuilderTemplate');
    localStorage.removeItem('resumeBuilder_isAuthenticated');
    localStorage.removeItem('resumeBuilder_user');
  };

  const handleUpdateProfile = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const updateResumeData = (section: keyof ResumeData, data: any) => {
    setResumeData(prev => ({
      ...prev,
      [section]: data
    }));
  };

  const dismissGuestBanner = () => {
    setShowGuestBanner(false);
    localStorage.setItem('resumeBuilder_guestBannerDismissed', 'true');
  };

  // Calculate completion status
  const getCompletionStatus = () => {
    const personalInfoComplete = !!(resumeData.personalInfo.fullName && resumeData.personalInfo.email);
    const hasExperience = resumeData.experience.length > 0;
    const hasEducation = resumeData.education.length > 0;
    const hasSkills = resumeData.skills.technical.length > 0 || resumeData.skills.soft.length > 0;
    
    return {
      personalInfo: personalInfoComplete,
      experience: hasExperience,
      education: hasEducation,
      skills: hasSkills
    };
  };

  const completionStatus = getCompletionStatus();
  const isResumeComplete = completionStatus.personalInfo && 
    (completionStatus.experience || completionStatus.education) && 
    completionStatus.skills;
  
  const completedSections = Object.values(completionStatus).filter(Boolean).length;
  const totalRequiredSections = 3; // personalInfo, (experience OR education), skills

  // Show loading spinner
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Main application (available to everyone)
  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <Sidebar 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
          completionStatus={completionStatus}
        />
        
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Guest User Benefits Banner */}
            {!isAuthenticated && showGuestBanner && (
              <Alert className="mb-6 bg-blue-50 border-blue-200">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-blue-900 mb-1">Using as Guest</h3>
                      <p className="text-blue-700 text-sm mb-3">
                        Your resume is saved locally. Sign up to sync across devices and access from anywhere!
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => setAuthDialogOpen(true)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <UserPlus className="w-3 h-3 mr-1" />
                          Sign Up Free
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setAuthDialogOpen(true)}
                          className="border-blue-300 text-blue-700 hover:bg-blue-50"
                        >
                          <LogIn className="w-3 h-3 mr-1" />
                          Sign In
                        </Button>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={dismissGuestBanner}
                    className="text-blue-600 hover:bg-blue-100 p-1"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </Alert>
            )}

            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-foreground">AI Resume Builder</h1>
                <p className="text-muted-foreground mt-1">Create professional, ATS-friendly resumes with AI assistance</p>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Authentication Status */}
                {isAuthenticated ? (
                  <div className="flex items-center gap-2">
                    {/* User Profile Dropdown */}
                    <Popover open={profileOpen} onOpenChange={setProfileOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span className="hidden sm:inline">{user?.name}</span>
                          <Menu className="w-3 h-3" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-0" align="end">
                        <UserProfile 
                          user={user!}
                          onSignOut={handleSignOut}
                          onUpdateProfile={handleUpdateProfile}
                        />
                      </PopoverContent>
                    </Popover>
                    
                    {/* Dedicated Sign Out Button */}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleSignOut}
                      className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
                    >
                      <LogOut className="w-3 h-3" />
                      <span className="hidden sm:inline">Sign Out</span>
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="flex items-center gap-1 text-amber-700 border-amber-300">
                      <User className="w-3 h-3" />
                      Guest Mode
                    </Badge>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setAuthDialogOpen(true)}
                      className="flex items-center gap-1"
                    >
                      <LogIn className="w-3 h-3" />
                      <span className="hidden sm:inline">Sign In</span>
                    </Button>
                  </div>
                )}

                {/* Completion Status Badge */}
                <div className="flex items-center gap-2">
                  {isResumeComplete ? (
                    <Badge variant="default" className="flex items-center gap-1 bg-green-100 text-green-800 border-green-300">
                      <CheckCircle className="w-3 h-3" />
                      Ready to Export
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="flex items-center gap-1 text-amber-700 border-amber-300">
                      <AlertCircle className="w-3 h-3" />
                      {completedSections}/{totalRequiredSections} Required Sections
                    </Badge>
                  )}
                </div>

                <Button
                  variant={isResumeComplete ? "default" : "outline"}
                  onClick={() => setExportDialogOpen(true)}
                  className="flex items-center gap-2"
                  disabled={!isResumeComplete}
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {isResumeComplete ? 'Export Resume' : 'Complete Resume to Export'}
                  </span>
                  <span className="sm:hidden">Export</span>
                </Button>
              </div>
            </div>

            {/* Progress indicator for incomplete resumes */}
            {!isResumeComplete && (
              <Card className="p-4 mb-6 bg-amber-50 border-amber-200">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-amber-900 mb-1">Complete Your Resume</h3>
                    <p className="text-amber-700 text-sm mb-3">
                      Add the following information to enable export functionality:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {!completionStatus.personalInfo && (
                        <Badge variant="outline" className="text-amber-700 border-amber-300">
                          Personal Information (Name & Email required)
                        </Badge>
                      )}
                      {!completionStatus.experience && !completionStatus.education && (
                        <Badge variant="outline" className="text-amber-700 border-amber-300">
                          Experience or Education
                        </Badge>
                      )}
                      {!completionStatus.skills && (
                        <Badge variant="outline" className="text-amber-700 border-amber-300">
                          Skills
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="builder" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Builder
                  {!isResumeComplete && (
                    <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0.5">
                      {completedSections}/{totalRequiredSections}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="preview" className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Preview
                </TabsTrigger>
                <TabsTrigger value="templates" className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Templates
                </TabsTrigger>
              </TabsList>

              <TabsContent value="builder" className="mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="lg:col-span-1">
                    <ResumeForm 
                      resumeData={resumeData}
                      onUpdateData={updateResumeData}
                    />
                  </div>
                  <div className="lg:col-span-1">
                    <div className="sticky top-6">
                      <Card className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold">Live Preview</h3>
                          {isResumeComplete && (
                            <Badge variant="default" className="flex items-center gap-1 bg-green-100 text-green-800 border-green-300">
                              <CheckCircle className="w-3 h-3" />
                              Complete
                            </Badge>
                          )}
                        </div>
                        <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
                          <ResumePreview 
                            resumeData={resumeData}
                            template={selectedTemplate}
                            scale={0.6}
                          />
                        </div>
                        {isResumeComplete && (
                          <div className="mt-4">
                            <Button 
                              onClick={() => setExportDialogOpen(true)}
                              className="w-full flex items-center gap-2"
                            >
                              <Download className="w-4 h-4" />
                              Export This Resume
                            </Button>
                          </div>
                        )}
                        
                        {/* Encourage sign-up for guest users */}
                        {!isAuthenticated && isResumeComplete && (
                          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Cloud className="w-4 h-4 text-blue-600" />
                              <p className="text-sm font-medium text-blue-900">Save Your Work</p>
                            </div>
                            <p className="text-xs text-blue-700 mb-3">
                              Sign up to save your resume and access it from any device.
                            </p>
                            <Button 
                              size="sm" 
                              onClick={() => setAuthDialogOpen(true)}
                              className="w-full bg-blue-600 hover:bg-blue-700"
                            >
                              <UserPlus className="w-3 h-3 mr-1" />
                              Create Free Account
                            </Button>
                          </div>
                        )}
                      </Card>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="preview" className="mt-6">
                <div className="flex justify-center">
                  <div className="max-w-4xl w-full">
                    <div className="mb-4 flex justify-center">
                      {isResumeComplete ? (
                        <div className="flex items-center gap-3">
                          <Button 
                            onClick={() => setExportDialogOpen(true)}
                            className="flex items-center gap-2"
                          >
                            <Download className="w-4 h-4" />
                            Export Resume
                          </Button>
                          {!isAuthenticated && (
                            <Button 
                              variant="outline"
                              onClick={() => setAuthDialogOpen(true)}
                              className="flex items-center gap-2 border-blue-300 text-blue-700 hover:bg-blue-50"
                            >
                              <UserPlus className="w-4 h-4" />
                              Save to Account
                            </Button>
                          )}
                        </div>
                      ) : (
                        <div className="text-center p-4 bg-amber-50 border border-amber-200 rounded-lg">
                          <p className="text-amber-700">
                            Complete your resume to enable export functionality
                          </p>
                        </div>
                      )}
                    </div>
                    <ResumePreview 
                      resumeData={resumeData}
                      template={selectedTemplate}
                      scale={1}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="templates" className="mt-6">
                <TemplateSelector
                  selectedTemplate={selectedTemplate}
                  onTemplateChange={setSelectedTemplate}
                  resumeData={resumeData}
                />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      {/* Export Dialog */}
      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        resumeData={resumeData}
        template={selectedTemplate}
      />

      {/* Authentication Dialog */}
      {authDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Join AI Resume Builder</h2>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setAuthDialogOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Benefits list for context */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">With an account, you get:</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3" />
                    Save and sync across devices
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3" />
                    Access from anywhere
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3" />
                    Never lose your work
                  </li>
                </ul>
              </div>
              
              <AuthForm onAuthenticated={handleAuthenticated} />
              
              <div className="mt-4 text-center">
                <Button 
                  variant="ghost" 
                  onClick={() => setAuthDialogOpen(false)}
                  className="text-muted-foreground"
                >
                  Continue as Guest
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast notifications */}
      <Toaster position="top-right" />
    </div>
  );
}
