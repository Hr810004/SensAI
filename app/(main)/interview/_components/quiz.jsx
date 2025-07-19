"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { generateQuiz, saveQuizResult } from "@/actions/interview";
import QuizResult from "./quiz-result";
import useFetch from "@/hooks/use-fetch";
import { BarLoader } from "react-spinners";
import PreQuizModal from "./pre-quiz-modal";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import * as faceapi from 'face-api.js';
import { Card } from "@/components/ui/card";
import ReactMarkdown from 'react-markdown';

let faceapiLoaded = false;

export default function Quiz() {
  const [preQuizOpen, setPreQuizOpen] = useState(true);
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [quizSections, setQuizSections] = useState(null);
  const [currentSection, setCurrentSection] = useState(null);
  const [currentSubsection, setCurrentSubsection] = useState(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [mcqAnswers, setMcqAnswers] = useState({});
  const [textAnswers, setTextAnswers] = useState({});
  const [audioAnswers, setAudioAnswers] = useState({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [feedback, setFeedback] = useState([]);
  const [recording, setRecording] = useState(false);
  const recognitionRef = useRef(null);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [mediaStream, setMediaStream] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [videoUrl, setVideoUrl] = useState("");
  const [quizFinished, setQuizFinished] = useState(false);
  const videoRef = useRef(null);
  const [faceDetected, setFaceDetected] = useState(true);
  const [noFaceTimer, setNoFaceTimer] = useState(null);
  const [quizResult, setQuizResult] = useState(null);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [isTabActive, setIsTabActive] = useState(true);
  const [audioLevel, setAudioLevel] = useState(0);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const audioSourceRef = useRef(null);
  const animationFrameRef = useRef(null);
  const [timer, setTimer] = useState(0);
  const timerIntervalRef = useRef(null);
  const [lastFaceDetectionState, setLastFaceDetectionState] = useState(true);
  const [lastTabSwitchesCount, setLastTabSwitchesCount] = useState(0);

  const { loading: generatingQuiz, fn: generateQuizFn, data: quizData } = useFetch(generateQuiz);
  const { loading: savingResult, fn: saveQuizResultFn, data: resultData, setData: setResultData } = useFetch(saveQuizResult);

  // Calculate total questions at component level
  const totalQuestions = quizSections ? Object.values(quizSections).reduce((total, section) => {
    return total + Object.values(section).reduce((sectionTotal, questions) => {
      return sectionTotal + questions.length;
    }, 0);
  }, 0) : 0;

  // Get current question
  const currentQuestion = quizSections && currentSection && currentSubsection 
    ? quizSections[currentSection][currentSubsection][currentQuestionIdx] 
    : null;

  // Get input type for current question
  const inputType = getInputType(currentSection, currentSubsection);

  // Helper function to get total questions in current subsection
  const getCurrentSubsectionQuestionsCount = () => {
    if (!quizSections || !currentSection || !currentSubsection) return 0;
    return quizSections[currentSection][currentSubsection]?.length || 0;
  };

  // Helper function to navigate to next subsection
  const navigateToNextSubsection = () => {
    if (!quizSections || !currentSection) return;
    
    const currentSubsections = Object.keys(quizSections[currentSection]);
    const currentSubIndex = currentSubsections.indexOf(currentSubsection);
    
    if (currentSubIndex < currentSubsections.length - 1) {
      // Move to next subsection in same section
      const nextSubsection = currentSubsections[currentSubIndex + 1];
      setCurrentSubsection(nextSubsection);
      setCurrentQuestionIdx(0);
      toast.success(`Moving to ${nextSubsection} subsection`);
    } else {
      // Move to next section
      const sectionNames = Object.keys(quizSections);
      const currentSectionIndex = sectionNames.indexOf(currentSection);
      
      if (currentSectionIndex < sectionNames.length - 1) {
        const nextSection = sectionNames[currentSectionIndex + 1];
        const firstSubsection = Object.keys(quizSections[nextSection])[0];
        setCurrentSection(nextSection);
        setCurrentSubsection(firstSubsection);
        setCurrentQuestionIdx(0);
        toast.success(`Moving to ${nextSection} > ${firstSubsection}`);
      }
    }
  };

  // Helper function to navigate to previous subsection
  const navigateToPreviousSubsection = () => {
    if (!quizSections || !currentSection) return;
    
    const currentSubsections = Object.keys(quizSections[currentSection]);
    const currentSubIndex = currentSubsections.indexOf(currentSubsection);
    
    if (currentSubIndex > 0) {
      // Move to previous subsection in same section
      const prevSubsection = currentSubsections[currentSubIndex - 1];
      const prevSubsectionQuestions = quizSections[currentSection][prevSubsection]?.length || 0;
      setCurrentSubsection(prevSubsection);
      setCurrentQuestionIdx(prevSubsectionQuestions - 1);
      toast.success(`Moving to ${prevSubsection} subsection`);
    } else {
      // Move to previous section
      const sectionNames = Object.keys(quizSections);
      const currentSectionIndex = sectionNames.indexOf(currentSection);
      
      if (currentSectionIndex > 0) {
        const prevSection = sectionNames[currentSectionIndex - 1];
        const prevSectionSubsections = Object.keys(quizSections[prevSection]);
        const lastSubsection = prevSectionSubsections[prevSectionSubsections.length - 1];
        const lastSubsectionQuestions = quizSections[prevSection][lastSubsection]?.length || 0;
        setCurrentSection(prevSection);
        setCurrentSubsection(lastSubsection);
        setCurrentQuestionIdx(lastSubsectionQuestions - 1);
        toast.success(`Moving to ${prevSection} > ${lastSubsection}`);
      }
    }
  };

  useEffect(() => {
    if (quizData) {
      setMcqAnswers({});
      setTextAnswers({});
      setAudioAnswers({});
      setFeedback(new Array(quizData.length).fill(null));
    }
  }, [quizData]);

  // --- [1] Ensure video/audio preview always works, and mediaStream is set up reliably ---
  useEffect(() => {
    if (!preQuizOpen && !mediaStream) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then((stream) => {
          setMediaStream(stream);
          console.log('mediaStream set:', stream);
          const recorder = new window.MediaRecorder(stream);
          setMediaRecorder(recorder);
          const chunks = [];
          recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunks.push(e.data);
          };
          recorder.onstop = () => {
            const blob = new Blob(chunks, { type: "video/webm" });
            setVideoUrl(URL.createObjectURL(blob));
            setRecordedChunks(chunks);
          };
          recorder.start();
        })
        .catch(() => {
          alert("Could not access webcam/mic. Video recording will be disabled.");
        });
    }
    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [preQuizOpen]);

  // Always attach mediaStream to videoRef when available
  useEffect(() => {
    if (videoRef.current && mediaStream) {
      videoRef.current.srcObject = mediaStream;
    }
  }, [mediaStream]);

  // Audio level tracking with proper bounds
  useEffect(() => {
    if (mediaStream) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      audioSourceRef.current = audioContextRef.current.createMediaStreamSource(mediaStream);
      audioSourceRef.current.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateAudioLevel = () => {
        analyserRef.current.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / bufferLength;
        // Limit audio level to 0-100 range and apply smoothing
        const normalizedLevel = Math.min(100, Math.max(0, (avg / 128) * 100));
        setAudioLevel(normalizedLevel);
        animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
      };
      updateAudioLevel();
    }
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [mediaStream]);

  // --- [2] Improved face detection ---
  useEffect(() => {
    if (!mediaStream || quizFinished) return;
    
    let interval;
    let localNoFaceTimer = null;
    
    async function loadAndDetect() {
      if (!faceapiLoaded) {
        try {
          await faceapi.nets.tinyFaceDetector.loadFromUri('/models/tiny_face_detector');
          faceapiLoaded = true;
        } catch (err) {
          console.error('Failed to load face detection models:', err);
          return;
        }
      }
      
      if (videoRef.current && faceapiLoaded) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
        
        interval = setInterval(async () => {
          try {
            if (videoRef.current && videoRef.current.videoWidth > 0) {
              const detections = await faceapi.detectAllFaces(
                videoRef.current,
                new faceapi.TinyFaceDetectorOptions()
              );
              
              if (detections.length > 0) {
                setFaceDetected(true);
                if (localNoFaceTimer) {
                  clearTimeout(localNoFaceTimer);
                  localNoFaceTimer = null;
                }
              } else {
                if (!localNoFaceTimer) {
                  localNoFaceTimer = setTimeout(() => setFaceDetected(false), 3000);
                }
              }
            }
          } catch (err) {
            console.error('Face detection error:', err);
          }
        }, 1000);
      }
    }
    
    loadAndDetect();
    return () => {
      if (interval) clearInterval(interval);
      if (localNoFaceTimer) clearTimeout(localNoFaceTimer);
    };
  }, [mediaStream, quizFinished]);

  // --- [3] Tab switching and proctoring ---
  useEffect(() => {
    const handleTabSwitch = () => {
      if (document.hidden) {
        setIsTabActive(false);
        setTabSwitches(prev => prev + 1);
      } else {
        setIsTabActive(true);
      }
    };
    document.addEventListener('visibilitychange', handleTabSwitch);
    return () => {
      document.removeEventListener('visibilitychange', handleTabSwitch);
    };
  }, []);

  // --- [3.1] Toast notifications for tab switching ---
  useEffect(() => {
    if (tabSwitches > lastTabSwitchesCount && !quizFinished) {
      toast.warning(`⚠️ Tab switched ${tabSwitches} time${tabSwitches > 1 ? 's' : ''}. Please stay on this page.`, {
        duration: 4000,
        action: {
          label: 'OK',
          onClick: () => {}
        }
      });
      setLastTabSwitchesCount(tabSwitches);
    }
  }, [tabSwitches, lastTabSwitchesCount, quizFinished]);

  // --- [3.2] Toast notifications for face detection ---
  useEffect(() => {
    if (!quizFinished && faceDetected !== lastFaceDetectionState) {
      if (!faceDetected) {
        toast.error("🚫 No face detected! Please ensure you are present for the quiz.", {
          duration: 5000,
          action: {
            label: 'OK',
            onClick: () => {}
          }
        });
      } else {
        toast.success("✅ Face detected. You can continue with the quiz.", {
          duration: 3000
        });
      }
      setLastFaceDetectionState(faceDetected);
    }
  }, [faceDetected, lastFaceDetectionState, quizFinished]);

  // --- [3.3] Periodic face detection status reminder ---
  useEffect(() => {
    if (!quizFinished && faceDetected) {
      const reminderInterval = setInterval(() => {
        toast.info("👁️ Face detection is active. Please stay visible.", {
          duration: 2000
        });
      }, 30000); // Show reminder every 30 seconds

      return () => clearInterval(reminderInterval);
    }
  }, [quizFinished, faceDetected]);

  // --- [4] Quiz generation with proper error handling ---
  const handleStartQuiz = async (selectedCompany, selectedRole) => {
    if (!selectedCompany.trim() || !selectedRole.trim()) {
      alert("Please enter both company and role.");
      return;
    }
    setCompany(selectedCompany);
    setRole(selectedRole);
    setPreQuizOpen(false);
    setLoadingQuestions(true);
    try {
      const res = await fetch("/api/generate-quiz-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company: selectedCompany, role: selectedRole }),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Failed to generate quiz questions");
      }
      const data = await res.json();
      setQuizSections(data.quiz);
      const sectionNames = Object.keys(data.quiz);
      const firstSection = sectionNames[0];
      const firstSubsection = Object.keys(data.quiz[firstSection])[0];
      setCurrentSection(firstSection);
      setCurrentSubsection(firstSubsection);
    } catch (e) {
      alert("Failed to generate quiz questions: " + e.message);
    } finally {
      setLoadingQuestions(false);
      
      // Show quiz start notification
      if (quizSections) {
        toast.success("🎯 Quiz started! Face detection and tab monitoring are active.", {
          duration: 4000,
          action: {
            label: 'Got it',
            onClick: () => {}
          }
        });
      }
    }
  };

  // Start timer when quizSections are set
  useEffect(() => {
    if (quizSections && !quizFinished) {
      setTimer(0);
      timerIntervalRef.current = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }
    if (quizFinished && timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [quizSections, quizFinished]);

  // Format timer as mm:ss
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // --- [5] Input type determination ---
  function getInputType(section, subsection) {
    if (section === "Aptitude") return "mcq";
    if (section === "CS Fundamentals") return "mcq";
    if (section === "Behavioral & Communication") return "audio";
    return "mcq";
  }

  // --- [6] Fixed MCQ handling ---
  const handleMcqChange = (val) => {
    setMcqAnswers((prev) => ({
      ...prev,
      [currentSection]: {
        ...(prev[currentSection] || {}),
        [currentSubsection]: {
          ...(prev[currentSection]?.[currentSubsection] || {}),
          [currentQuestionIdx]: val
        }
      },
    }));
  };

  const handleTextChange = (e) => {
    setTextAnswers((prev) => ({
      ...prev,
      [currentSection]: {
        ...(prev[currentSection] || {}),
        [currentSubsection]: {
          ...(prev[currentSection]?.[currentSubsection] || {}),
          [currentQuestionIdx]: e.target.value
        }
      },
    }));
  };

  const handleStartRecording = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      toast.error("Speech recognition not supported in this browser.");
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      try {
        const transcript = event.results[0][0].transcript;
        if (inputType === "text-audio") {
          setTextAnswers((prev) => ({
            ...prev,
            [currentSection]: {
              ...(prev[currentSection] || {}),
              [currentSubsection]: {
                ...(prev[currentSection]?.[currentSubsection] || {}),
                [currentQuestionIdx]: transcript
              }
            },
          }));
        } else if (inputType === "audio") {
          setAudioAnswers((prev) => ({
            ...prev,
            [currentSection]: {
              ...(prev[currentSection] || {}),
              [currentSubsection]: {
                ...(prev[currentSection]?.[currentSubsection] || {}),
                [currentQuestionIdx]: transcript
              }
            },
          }));
        }
        toast.success("Answer recorded successfully!");
      } catch (error) {
        console.error("Speech recognition error:", error);
        toast.error("Failed to process speech. Please try again.");
      }
    };
    recognition.onend = () => setRecording(false);
    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setRecording(false);
      if (event.error === 'no-speech') {
        toast.error("No speech detected. Please try again.");
      } else {
        toast.error("Speech recognition failed. Please try again.");
      }
    };
    recognitionRef.current = recognition;
    setRecording(true);
    toast.info("Listening... Speak now.");
    recognition.start();
  };

  const handleStopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setRecording(false);
    }
  };

  // --- [7] Fixed quiz completion with proper saving ---
  const handleFinishQuiz = async () => {
    // Check if user has answered any questions
    const hasAnsweredQuestions = Object.keys(mcqAnswers).length > 0 || 
                                Object.keys(textAnswers).length > 0 || 
                                Object.keys(audioAnswers).length > 0;
    
    if (!hasAnsweredQuestions) {
      const confirmed = window.confirm(
        "You haven't answered any questions yet. Are you sure you want to finish the quiz?\n\n" +
        "Your score will be 0% and no answers will be saved."
      );
      if (!confirmed) {
        return;
      }
    }
    
    setQuizFinished(true);
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop();
    }
    
    const sectionScores = {};
    let totalScore = 0;
    let totalQuestions = 0;
    const questionsReview = [];
    
    Object.entries(quizSections).forEach(([section, subs]) => {
      let sectionCorrect = 0;
      let sectionTotal = 0;
      Object.entries(subs).forEach(([sub, qs]) => {
        qs.forEach((q, idx) => {
          let userAnswer = "";
          if (section === "Aptitude" || section === "CS Fundamentals") {
            userAnswer = mcqAnswers[section]?.[sub]?.[idx] || "";
          } else {
            userAnswer = audioAnswers[section]?.[sub]?.[idx] || "";
          }
          const correct = q.correctAnswer && userAnswer === q.correctAnswer;
          if (correct) sectionCorrect++;
          sectionTotal++;
          questionsReview.push({
            section,
            subsection: sub,
            question: q.question,
            userAnswer,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            isCorrect: !!correct,
          });
        });
      });
      sectionScores[section] = sectionTotal ? (sectionCorrect / sectionTotal) * 100 : 0;
      totalScore += sectionCorrect;
      totalQuestions += sectionTotal;
    });
    
    const improvementTips = {
      Aptitude: "Review your mistakes and practice more company-specific aptitude questions.",
      "CS Fundamentals": "Focus on explaining your thought process clearly in technical questions.",
      "Behavioral & Communication": "Practice speaking confidently and concisely about your experiences.",
    };
    
    const finalScore = totalQuestions ? (totalScore / totalQuestions) * 100 : 0;
    
    const result = {
      quizScore: finalScore,
      sectionScores,
      improvementTips,
      questions: questionsReview,
      proctoringData: {
        tabSwitches,
        isTabActive
      }
    };
    
    setQuizResult(result);
    
    // Show monitoring summary
    if (tabSwitches > 0) {
      toast.warning(`📊 Quiz completed! Tab switches detected: ${tabSwitches}`, {
        duration: 5000
      });
    } else {
      toast.success("🎉 Quiz completed successfully! No tab switches detected.", {
        duration: 4000
      });
    }
    
    // Save the quiz result
    try {
      await saveQuizResultFn(questionsReview, questionsReview.map(q => q.userAnswer), finalScore);
      toast.success("Quiz result saved successfully!");
    } catch (error) {
      console.error("Failed to save quiz result:", error);
      toast.error("Failed to save quiz result");
    }
  };

  if (preQuizOpen) {
    return <PreQuizModal open={preQuizOpen} onStart={handleStartQuiz} onOpenChange={setPreQuizOpen} />;
  }

  // Always define sectionNames safely
  const sectionNames = quizSections ? Object.keys(quizSections) : [];
  const subsectionNames = quizSections && currentSection && quizSections[currentSection]
    ? Object.keys(quizSections[currentSection])
    : [];

  return (
    <div>
      {/* Show quiz result when finished */}
      {quizFinished && quizResult ? (
        <QuizResult 
          result={quizResult} 
          videoUrl={videoUrl} 
          onStartNew={() => {
            setQuizFinished(false);
            setQuizResult(null);
            setPreQuizOpen(true);
            setCurrentQuestionIdx(0);
            setMcqAnswers({});
            setTextAnswers({});
            setAudioAnswers({});
          }}
        />
      ) : (
        <>
          {/* Loading state with video preview */}
          {loadingQuestions || !quizSections ? (
            <div className="flex flex-col items-center mt-8">
              {/* Video Preview during loading */}
              {mediaStream && (
                <div className="flex flex-col items-center justify-center min-h-[300px] mb-6">
                  {/* Audio Level Bar */}
                  <div className="mb-2 w-full max-w-xs">
                    <div className="text-xs text-muted-foreground mb-1">Audio is ON</div>
                    <div className="w-full h-2 bg-muted rounded">
                      <div
                        className="h-2 bg-green-500 rounded transition-all"
                        style={{ width: `${audioLevel}%` }}
                      />
                    </div>
                  </div>
                  {/* Video Preview */}
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-48 h-36 rounded shadow border"
                    style={{ objectFit: "cover" }}
                  />
                  <div className="mt-4">
                    <BarLoader color="#4ade80" width={200} />
                    <div className="text-sm text-muted-foreground mt-2">
                      Preparing your quiz...
                    </div>
                  </div>
                </div>
              )}
              <span className="mb-2 text-muted-foreground text-sm">Quiz generation may take 10–20 seconds. Please wait...</span>
              <BarLoader width={200} color="gray" />
            </div>
          ) : (
            <div className="mx-2 relative">
              {/* Video Preview with Audio Bar and Timer */}
              {mediaStream && !quizFinished && !loadingQuestions && (
                <div className="flex flex-col items-center justify-center mb-6">
                  {/* Audio Level Bar */}
                  <div className="mb-2 w-full max-w-xs">
                    <div className="text-xs text-muted-foreground mb-1">Audio is ON</div>
                    <div className="w-full h-2 bg-muted rounded">
                      <div
                        className="h-2 bg-green-500 rounded transition-all"
                        style={{ width: `${audioLevel}%` }}
                      />
                    </div>
                  </div>
                  {/* Video Preview */}
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-48 h-36 rounded shadow border"
                    style={{ objectFit: "cover" }}
                  />
                  {/* Timer */}
                  <div className="text-lg font-mono bg-muted px-4 py-2 rounded shadow whitespace-nowrap mt-2">
                    ⏱️ {formatTime(timer)}
                  </div>
                </div>
              )}
              
              {/* Fallback if webcam is not accessible */}
              {!mediaStream && !quizFinished && !loadingQuestions && (
                <div className="mb-4 text-center text-red-600 font-semibold">
                  Webcam not accessible. Please enable your webcam for video preview and face detection.
                </div>
              )}
              
              
              <h2 className="text-3xl font-bold mb-6 text-foreground bg-muted/30 p-4 rounded-lg text-center">
                Quiz for {company} - {role}
              </h2>
              
              {/* Current Section and Subsection Indicator */}
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="text-center">
                  <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">Current Section</div>
                  <div className="text-lg font-bold text-blue-800 dark:text-blue-200">{currentSection}</div>
                  <div className="text-sm text-blue-600 dark:text-blue-400 font-medium mt-1">Current Subsection</div>
                  <div className="text-md font-semibold text-blue-800 dark:text-blue-200">{currentSubsection}</div>
                </div>
              </div>
              
              {/* Section Navigation */}
              <div className="flex gap-4 mb-4 overflow-x-auto">
                {sectionNames.map((section) => (
                  <button
                    key={section}
                    className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                      section === currentSection 
                        ? "bg-blue-600 text-white shadow-lg" 
                        : "bg-gray-700 text-white hover:bg-gray-600 border border-gray-600"
                    }`}
                    onClick={() => {
                      setCurrentSection(section);
                      const firstSub = quizSections[section] ? Object.keys(quizSections[section])[0] : null;
                      setCurrentSubsection(firstSub);
                      setCurrentQuestionIdx(0);
                    }}
                  >
                    {section}
                  </button>
                ))}
              </div>
              
              {/* Subsection Navigation */}
              <div className="flex gap-2 mb-4 overflow-x-auto">
                {subsectionNames.map((sub) => (
                  <button
                    key={sub}
                    className={`px-3 py-1.5 rounded-md text-sm whitespace-nowrap transition-colors ${
                      sub === currentSubsection 
                        ? "bg-blue-600 text-white shadow-md" 
                        : "bg-gray-700 text-white hover:bg-gray-600 border border-gray-600"
                    }`}
                    onClick={() => {
                      setCurrentSubsection(sub);
                      setCurrentQuestionIdx(0);
                    }}
                  >
                    {sub}
                  </button>
                ))}
              </div>
              
              {/* Question Card */}
              <Card className="mb-4">
                <div className="font-semibold mb-3 text-foreground text-lg bg-muted/50 p-3 rounded-lg">
                  Question {currentQuestionIdx + 1} of {getCurrentSubsectionQuestionsCount()} - {currentSubsection}
                </div>
                
                {/* Progress Indicator */}
                <div className="mb-4 p-3 bg-muted/30 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-foreground">Progress in {currentSubsection}</span>
                    <span className="text-sm text-muted-foreground">
                      {(() => {
                        const currentSubsectionQuestions = getCurrentSubsectionQuestionsCount();
                        const answeredInCurrentSubsection = (() => {
                          if (currentSection === "Aptitude" || currentSection === "CS Fundamentals") {
                            return mcqAnswers[currentSection]?.[currentSubsection] ? 
                              Object.keys(mcqAnswers[currentSection][currentSubsection]).length : 0;
                          } else {
                            return audioAnswers[currentSection]?.[currentSubsection] ? 
                              Object.keys(audioAnswers[currentSection][currentSubsection]).length : 0;
                          }
                        })();
                        return `${answeredInCurrentSubsection}/${currentSubsectionQuestions} answered`;
                      })()}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${(() => {
                          const currentSubsectionQuestions = getCurrentSubsectionQuestionsCount();
                          const answeredInCurrentSubsection = (() => {
                            if (currentSection === "Aptitude" || currentSection === "CS Fundamentals") {
                              return mcqAnswers[currentSection]?.[currentSubsection] ? 
                                Object.keys(mcqAnswers[currentSection][currentSubsection]).length : 0;
                            } else {
                              return audioAnswers[currentSection]?.[currentSubsection] ? 
                                Object.keys(audioAnswers[currentSection][currentSubsection]).length : 0;
                            }
                          })();
                          return currentSubsectionQuestions > 0 ? 
                            Math.max(0, (answeredInCurrentSubsection / currentSubsectionQuestions) * 100) : 0;
                        })()}%` 
                      }}
                    />
                  </div>
                </div>
                <div className="mb-2 text-foreground">
                  <ReactMarkdown className="markdown-content">
                    {currentQuestion?.question || "No questions found."}
                  </ReactMarkdown>
                </div>
                
                {/* MCQ Options */}
                {inputType === "mcq" && (
                  <RadioGroup
                    value={mcqAnswers[currentSection]?.[currentSubsection]?.[currentQuestionIdx] || ""}
                    onValueChange={handleMcqChange}
                    className="space-y-2"
                  >
                    {currentQuestion?.options?.map((option, idx) => (
                      <div key={idx} className="flex items-start space-x-2">
                        <RadioGroupItem value={option} id={`option-${idx}`} className="mt-1" />
                        <Label htmlFor={`option-${idx}`} className="text-foreground cursor-pointer flex-1">
                          <ReactMarkdown className="markdown-content text-sm">
                            {option}
                          </ReactMarkdown>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}
                
                {/* Text/Audio Input */}
                {inputType === "text-audio" && (
                  <div className="space-y-2">
                    <Label htmlFor="text-answer" className="text-foreground">Your Answer (Text or Audio)</Label>
                    <Input
                      id="text-answer"
                      value={textAnswers[currentSection]?.[currentSubsection]?.[currentQuestionIdx] || ""}
                      onChange={handleTextChange}
                      placeholder="Type your answer or use the mic"
                      className="text-foreground"
                    />
                    <Button
                      type="button"
                      onClick={recording ? handleStopRecording : handleStartRecording}
                      variant={recording ? "destructive" : "secondary"}
                      className="mt-2"
                    >
                      {recording ? "Stop Recording" : "Record Answer (Mic)"}
                    </Button>
                  </div>
                )}
                
                {/* Audio Only Input */}
                {inputType === "audio" && (
                  <div className="space-y-2">
                    <Label className="text-foreground">Your Answer (Audio Only)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        value={audioAnswers[currentSection]?.[currentSubsection]?.[currentQuestionIdx] || ""}
                        readOnly
                        placeholder="Your spoken answer will appear here"
                        className="text-foreground"
                      />
                      <Button
                        type="button"
                        onClick={recording ? handleStopRecording : handleStartRecording}
                        variant={recording ? "destructive" : "secondary"}
                      >
                        {recording ? "Stop Recording" : "Record Answer (Mic)"}
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
              
              {/* Navigation Buttons */}
              <div className="flex justify-between mb-4">
                <Button
                  onClick={() => {
                    if (currentQuestionIdx > 0) {
                      setCurrentQuestionIdx((i) => i - 1);
                    } else {
                      navigateToPreviousSubsection();
                    }
                  }}
                  disabled={currentQuestionIdx === 0 && 
                    (() => {
                      const currentSubsections = Object.keys(quizSections[currentSection] || {});
                      const currentSubIndex = currentSubsections.indexOf(currentSubsection);
                      const sectionNames = Object.keys(quizSections || {});
                      const currentSectionIndex = sectionNames.indexOf(currentSection);
                      return currentSubIndex === 0 && currentSectionIndex === 0;
                    })()}
                  variant="secondary"
                  className="px-6 py-2 font-semibold"
                >
                  Previous
                </Button>
                <Button
                  onClick={() => {
                    const currentSubsectionQuestions = getCurrentSubsectionQuestionsCount();
                    if (currentQuestionIdx < currentSubsectionQuestions - 1) {
                      setCurrentQuestionIdx((i) => i + 1);
                    } else {
                      navigateToNextSubsection();
                    }
                  }}
                  disabled={(() => {
                    const currentSubsectionQuestions = getCurrentSubsectionQuestionsCount();
                    const currentSubsections = Object.keys(quizSections[currentSection] || {});
                    const currentSubIndex = currentSubsections.indexOf(currentSubsection);
                    const sectionNames = Object.keys(quizSections || {});
                    const currentSectionIndex = sectionNames.indexOf(currentSection);
                    return currentQuestionIdx === currentSubsectionQuestions - 1 && 
                           currentSubIndex === currentSubsections.length - 1 && 
                           currentSectionIndex === sectionNames.length - 1;
                  })()}
                  className="px-6 py-2 font-semibold"
                >
                  Next
                </Button>
              </div>
              
              {/* Finish Quiz Button */}
              <Button 
                className={`w-full py-3 font-semibold text-lg ${
                  (() => {
                    const answeredCount = Object.keys(mcqAnswers).length + 
                                        Object.keys(textAnswers).length + 
                                        Object.keys(audioAnswers).length;
                    return answeredCount === 0 ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-primary hover:bg-primary/90';
                  })()
                }`} 
                onClick={handleFinishQuiz}
              >
                {(() => {
                  const answeredCount = Object.keys(mcqAnswers).length + 
                                      Object.keys(textAnswers).length + 
                                      Object.keys(audioAnswers).length;
                  return answeredCount === 0 ? 'Finish Quiz (No Answers)' : 'Finish Quiz';
                })()}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
