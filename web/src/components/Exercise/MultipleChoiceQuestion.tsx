import "./ExerciseComponents.css";

export type Option = {
  letter: string;
  text: string;
};

type MultipleChoiceQuestionProps = {
  question: string;
  options: Option[];
  selectedAnswer?: string;
  onAnswer: (letter: string) => void;
  disabled?: boolean;
};

export default function MultipleChoiceQuestion({
  question,
  options,
  selectedAnswer,
  onAnswer,
  disabled = false,
}: MultipleChoiceQuestionProps) {
  return (
    <div className="mcqContainer">
      <div className="mcqQuestion">{question}</div>

      <div className="mcqOptions">
        {options.map((option) => (
          <label key={option.letter} className="mcqOption">
            <input
              type="radio"
              name={question}
              value={option.letter}
              checked={selectedAnswer === option.letter}
              onChange={(e) => onAnswer(e.target.value)}
              disabled={disabled}
            />
            <span className="mcqLabel">
              <span className="mcqLetter">{option.letter})</span>
              <span className="mcqText">{option.text}</span>
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
