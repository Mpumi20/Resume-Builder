import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ResumeForm } from './components/ResumeForm';
import { ResumePreview } from './components/ResumePreview';
import { TemplateSelector } from './components/TemplateSelector';
import { ExportDialog } from './components/ExportDialog';
import { Button } from './components/ui/button';
import { Card } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Toaster } from './components/ui/sonner';
import { Download, Eye, Settings, FileText, CheckCircle, AlertCircle } from 'lucide-react';

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
  const [resumeData, setResumeData] = useState<ResumeData>(initialResumeData);
  const [selectedTemplate, setSelectedTemplate] = useState<ResumeTemplate>('professional');
  const [activeTab, setActiveTab] = useState('builder');
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedData = localStorage.getItem('resumeBuilderData');
    const savedTemplate = localStorage.getItem('resumeBuilderTemplate');
    
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
  }, []);

  // Save data to localStorage whenever resumeData changes
  useEffect(() => {
    localStorage.setItem('resumeBuilderData', JSON.stringify(resumeData));
  }, [resumeData]);

  // Save template to localStorage whenever selectedTemplate changes
  useEffect(() => {
    localStorage.setItem('resumeBuilderTemplate', selectedTemplate);
  }, [selectedTemplate]);

  const updateResumeData = (section: keyof ResumeData, data: any) => {
    setResumeData(prev => ({
      ...prev,
      [section]: data
    }));
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
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-foreground">AI Resume Builder</h1>
                <p className="text-muted-foreground mt-1">Create professional, ATS-friendly resumes with AI assistance</p>
              </div>
              
              <div className="flex items-center gap-3">
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
                  {isResumeComplete ? 'Export Resume' : 'Complete Resume to Export'}
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
                        <Button 
                          onClick={() => setExportDialogOpen(true)}
                          className="flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Export Resume
                        </Button>
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

      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        resumeData={resumeData}
        template={selectedTemplate}
      />

      {/* Toast notifications */}
      <Toaster position="top-right" />
    </div>
  );
}