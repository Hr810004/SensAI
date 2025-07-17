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

  const { loading: generatingQuiz, fn: generateQuizFn, data: quizData } = useFetch(generateQuiz);
  const { loading: savingResult, fn: saveQuizResultFn, data: resultData, setData: setResultData } = useFetch(saveQuizResult);

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

  // Audio level tracking
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
        setAudioLevel(avg);
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

  // --- [2] Robust face detection ---
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
                localNoFaceTimer = setTimeout(() => setFaceDetected(false), 5000);
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

  // --- [3] Tab switching and proctoring (already robust, but add more feedback if needed) ---
  useEffect(() => {
    const handleTabSwitch = () => {
      if (document.hidden) {
        setIsTabActive(false);
        setTabSwitches(prev => prev + 1);
        toast.warning("Tab switching detected! Please stay on this page.");
      } else {
        setIsTabActive(true);
      }
    };
    document.addEventListener('visibilitychange', handleTabSwitch);
    return () => {
      document.removeEventListener('visibilitychange', handleTabSwitch);
    };
  }, []);

  // --- [4] Add error handling for quiz generation ---
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
    }
  };

  // Start timer when quizSections are set (questions rendered)
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

  // --- [5] Missing Functions ---
  function getInputType(section, subsection) {
    if (section === "Aptitude") return "mcq";
    if (section === "CS Fundamentals" && subsection === "DSA") return "text-audio";
    if (section === "CS Fundamentals") return "audio";
    if (section === "Behavioral & Communication") return "audio";
    return "mcq";
  }

  const handleMcqChange = (val) => {
    setMcqAnswers((prev) => ({
      ...prev,
      [currentSection]: {
        ...(prev[currentSection] || {}),
        [currentSubsection]: [
          ...(prev[currentSection]?.[currentSubsection] || []),
        ].map((a, i) => (i === currentQuestionIdx ? val : a)),
      },
    }));
  };

  const handleTextChange = (e) => {
    setTextAnswers((prev) => ({
      ...prev,
      [currentSection]: {
        ...(prev[currentSection] || {}),
        [currentSubsection]: [
          ...(prev[currentSection]?.[currentSubsection] || []),
        ].map((a, i) => (i === currentQuestionIdx ? e.target.value : a)),
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
              [currentSubsection]: [
                ...(prev[currentSection]?.[currentSubsection] || []),
              ].map((a, i) => (i === currentQuestionIdx ? transcript : a)),
            },
          }));
        } else if (inputType === "audio") {
          setAudioAnswers((prev) => ({
            ...prev,
            [currentSection]: {
              ...(prev[currentSection] || {}),
              [currentSubsection]: [
                ...(prev[currentSection]?.[currentSubsection] || []),
              ].map((a, i) => (i === currentQuestionIdx ? transcript : a)),
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

  const handleFinishQuiz = () => {
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
          if (section === "Aptitude") {
            userAnswer = mcqAnswers[section]?.[sub]?.[idx] || "";
          } else if (section === "CS Fundamentals" && sub === "DSA") {
            userAnswer = textAnswers[section]?.[sub]?.[idx] || "";
          } else {
            userAnswer = audioAnswers[section]?.[sub]?.[idx] || "";
          }
          const correct = section === "Aptitude" && q.correctAnswer && userAnswer === q.correctAnswer;
          if (section === "Aptitude") {
            if (correct) sectionCorrect++;
            sectionTotal++;
          }
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
      if (section === "Aptitude") {
        sectionScores[section] = sectionTotal ? (sectionCorrect / sectionTotal) * 100 : 0;
        totalScore += sectionCorrect;
        totalQuestions += sectionTotal;
      }
    });
    const improvementTips = {
      Aptitude: "Review your mistakes and practice more company-specific aptitude questions.",
      "CS Fundamentals": "Focus on explaining your thought process clearly in technical questions.",
      "Behavioral & Communication": "Practice speaking confidently and concisely about your experiences.",
    };
    const finalScore = totalQuestions ? (totalScore / totalQuestions) * 100 : 0;
    setQuizResult({
      quizScore: finalScore, // Use only quizScore for consistency across all components
      sectionScores,
      improvementTips,
      questions: questionsReview,
      proctoringData: {
        tabSwitches,
        isTabActive
      }
    });
  };

  if (preQuizOpen) {
    return <PreQuizModal open={preQuizOpen} onStart={handleStartQuiz} onOpenChange={setPreQuizOpen} />;
  }

  if (loadingQuestions || !quizSections) {
    return (
      <div className="flex flex-col items-center mt-8">
        <span className="mb-2 text-muted-foreground text-sm">Quiz generation may take 10–20 seconds. Please wait...</span>
        <BarLoader width={200} color="gray" />
      </div>
    );
  }

  const sectionNames = quizSections ? Object.keys(quizSections) : [];
  const subsectionNames =
    quizSections && currentSection && quizSections[currentSection]
      ? Object.keys(quizSections[currentSection])
      : [];
  const questionsArray =
    quizSections && currentSection && currentSubsection && quizSections[currentSection] && quizSections[currentSection][currentSubsection]
      ? quizSections[currentSection][currentSubsection]
      : [];
  const totalQuestions = questionsArray.length;
  const currentQuestion = questionsArray[currentQuestionIdx] || null;
  const inputType = getInputType(currentSection, currentSubsection);

  if (quizFinished) {
    return (
      <Dialog open={quizFinished} onOpenChange={setQuizFinished}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Quiz Result</DialogTitle>
            <DialogDescription id="quiz-desc">
              Here are your quiz results and feedback.
            </DialogDescription>
          </DialogHeader>
          <QuizResult
            result={quizResult}
            videoUrl={videoUrl}
            onStartNew={() => window.location.reload()}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="mx-2 relative">
      {/* Timer on top right */}
      {quizSections && !quizFinished && (
        <div className="absolute top-2 right-4 z-20 bg-muted px-4 py-2 rounded shadow text-lg font-mono">
          ⏱️ {formatTime(timer)}
        </div>
      )}
      {/* Show video/audio check while quiz is loading */}
      {loadingQuestions && mediaStream && (
        <div className="flex flex-col items-center justify-center min-h-[300px]">
          {/* Audio Level Bar */}
          <div className="mb-2 w-full max-w-xs">
            <div className="text-xs text-muted-foreground mb-1">Audio is ON</div>
            <div className="w-full h-2 bg-muted rounded">
              <div
                className="h-2 bg-green-500 rounded transition-all"
                style={{ width: `${Math.min(100, (audioLevel / 128) * 100)}%` }}
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
      {/* Audio Level Bar and Timer on the same line */}
      {mediaStream && !quizFinished && !loadingQuestions && (
        <div className="mb-2 flex items-center justify-between w-full max-w-lg">
          <div className="flex-1 mr-4">
            <div className="text-xs text-muted-foreground mb-1">Audio is ON</div>
            <div className="w-full h-2 bg-muted rounded">
              <div
                className="h-2 bg-green-500 rounded transition-all"
                style={{ width: `${Math.min(100, (audioLevel / 128) * 100)}%` }}
              />
            </div>
          </div>
          {quizSections && !quizFinished && (
            <div className="text-lg font-mono bg-muted px-4 py-2 rounded shadow whitespace-nowrap">
              ⏱️ {formatTime(timer)}
            </div>
          )}
        </div>
      )}
      {/* Video Preview - always visible when mediaStream is available and quiz is not finished */}
      {mediaStream && !quizFinished && !loadingQuestions && (
        <div className="flex justify-center mb-4">
          <video
            ref={videoRef}
            width={180}
            height={135}
            className="rounded border-2 border-primary bg-black shadow-lg"
            style={{ display: "block" }}
            muted
            autoPlay
          />
        </div>
      )}
      {/* Fallback if webcam is not accessible */}
      {!mediaStream && !quizFinished && !loadingQuestions && (
        <div className="mb-4 text-center text-red-600 font-semibold">
          Webcam not accessible. Please enable your webcam for video preview and face detection.
        </div>
      )}
      {!faceDetected && (
        <div className="bg-red-100 text-red-700 p-2 rounded mb-2 font-semibold text-center">
          No face detected! Please ensure you are present for the quiz.
        </div>
      )}
      
      {tabSwitches > 0 && (
        <div className="bg-yellow-100 text-yellow-800 p-2 rounded mb-2 font-semibold text-center">
          ⚠️ Tab switched {tabSwitches} time{tabSwitches > 1 ? 's' : ''}. Please stay on this page.
        </div>
      )}
      <h2 className="text-2xl font-bold mb-4">Quiz for {company} - {role}</h2>
      <div className="flex gap-4 mb-4">
        {sectionNames.map((section) => (
          <button
            key={section}
            className={`px-3 py-1 rounded font-semibold ${section === currentSection ? "bg-primary text-white" : "bg-muted"}`}
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
      <div className="flex gap-2 mb-4">
        {subsectionNames.map((sub) => (
          <button
            key={sub}
            className={`px-2 py-1 rounded text-sm ${sub === currentSubsection ? "bg-primary text-white" : "bg-muted"}`}
            onClick={() => {
              setCurrentSubsection(sub);
              setCurrentQuestionIdx(0);
            }}
          >
            {sub}
          </button>
        ))}
      </div>
      <Card className="mb-4">
        <div className="font-medium mb-2">
          Question {currentQuestionIdx + 1} of {totalQuestions}
        </div>
        <div className="mb-2">
          {currentQuestion?.question || "No questions found."}
          {/* Render code snippet for DSA questions if present */}
          {currentSection === "CS Fundamentals" && currentSubsection === "DSA" && currentQuestion?.code && (
            <pre className="bg-muted rounded p-3 mt-3 overflow-x-auto text-sm"><code>{currentQuestion.code}</code></pre>
          )}
        </div>
        {inputType === "mcq" && (
          <RadioGroup
            value={mcqAnswers[currentSection]?.[currentSubsection]?.[currentQuestionIdx] || ""}
            onValueChange={handleMcqChange}
            className="space-y-2"
          >
            {currentQuestion.options?.map((option, idx) => (
              <div key={idx} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`option-${idx}`} />
                <Label htmlFor={`option-${idx}`}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
        )}
        {inputType === "text-audio" && (
          <div className="space-y-2">
            <Label htmlFor="text-answer">Your Answer (Text or Audio)</Label>
            <Input
              id="text-answer"
              value={textAnswers[currentSection]?.[currentSubsection]?.[currentQuestionIdx] || ""}
              onChange={handleTextChange}
              placeholder="Type your answer or use the mic"
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
        {inputType === "audio" && (
          <div className="space-y-2">
            <Label>Your Answer (Audio Only)</Label>
            <div className="flex items-center gap-2">
              <Input
                value={audioAnswers[currentSection]?.[currentSubsection]?.[currentQuestionIdx] || ""}
                readOnly
                placeholder="Your spoken answer will appear here"
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
      <div className="flex justify-between">
        <Button
          onClick={() => setCurrentQuestionIdx((i) => Math.max(0, i - 1))}
          disabled={currentQuestionIdx === 0}
          variant="secondary"
        >
          Previous
        </Button>
        <Button
          onClick={() => setCurrentQuestionIdx((i) => Math.min(totalQuestions - 1, i + 1))}
          disabled={currentQuestionIdx === totalQuestions - 1}
        >
          Next
        </Button>
        <Button className="mt-6 w-full" onClick={handleFinishQuiz}>
          Finish Quiz
        </Button>
      </div>
    </div>
  );
}
