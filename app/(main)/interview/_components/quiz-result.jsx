"use client";

import { Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import ReactMarkdown from 'react-markdown';

export default function QuizResult({ result, videoUrl, onStartNew, hideStartNew }) {
  if (!result) return null;

  return (
    <div className="mx-auto">
      <h1 className="flex items-center gap-2 text-3xl hero-gradient-cyber animate-gradient text-transparent bg-clip-text leading-[1.25] mb-4 overflow-visible">
        <Trophy className="h-6 w-6 text-yellow-500" />
        Quiz Results
      </h1>
      <CardContent className="space-y-6">
        {/* Score Overview */}
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-bold">{result.quizScore?.toFixed(1)}%</h3>
          <Progress value={result.quizScore} className="w-full" />
        </div>
        {/* Section Breakdown */}
        {result.sectionScores && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(result.sectionScores).map(([section, score]) => (
              <div key={section} className="bg-muted p-3 rounded-lg text-center">
                <div className="font-semibold">{section}</div>
                <div className="text-xl font-bold">{score.toFixed(1)}%</div>
              </div>
            ))}
          </div>
        )}
        {/* AI Improvement Tips */}
        {result.improvementTips && (
          <div className="bg-muted p-4 rounded-lg">
            <p className="font-medium">AI Improvement Tips:</p>
            <ul className="list-disc ml-6">
              {Object.entries(result.improvementTips).map(([section, tip]) => (
                <li key={section}><span className="font-semibold">{section}:</span> {tip}</li>
              ))}
            </ul>
          </div>
        )}
        {/* Questions Review */}
        <div className="space-y-4">
          <h3 className="font-medium">Question Review</h3>
          {result.questions?.map((q, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-2">
              <div className="font-medium">{q.section} / {q.subsection}</div>
              <div className="font-medium">
                <ReactMarkdown className="prose prose-invert max-w-none markdown-content">
                  {q.question}
                </ReactMarkdown>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>Your answer: {q.userAnswer}</p>
                {q.correctAnswer && <p>Correct answer: {q.correctAnswer}</p>}
              </div>
              {q.explanation && (
                <div className="text-sm bg-muted p-2 rounded">
                  <p className="font-medium">Explanation:</p>
                  <ReactMarkdown className="prose prose-invert max-w-none markdown-content text-sm">
                    {q.explanation}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          ))}
        </div>
        {/* Video Preview & Download */}
        {videoUrl && (
          <div className="mt-6">
            <h3 className="font-medium mb-2 text-foreground">Quiz Session Recording</h3>
            <video src={videoUrl} controls className="w-full max-w-lg rounded shadow" />
            <a
              href={videoUrl}
              download="quiz-recording.webm"
              className="inline-block mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded shadow font-semibold"
            >
              Download Recording
            </a>
          </div>
        )}
      </CardContent>
      {!hideStartNew && (
        <CardFooter>
          <Button onClick={onStartNew} className="w-full">
            Start New Quiz
          </Button>
        </CardFooter>
      )}
    </div>
  );
}
