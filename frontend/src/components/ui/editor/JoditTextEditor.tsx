import { useRef, useMemo } from "react";
import JoditEditor from "jodit-react";

type Props = {
  content: string;
  label: string;
  required: boolean;
  setContent: React.Dispatch<React.SetStateAction<string>>;
  placeholder?: string;
};

const JoditTextEditor = ({
  content,
  setContent,
  placeholder,
  label = "",
  required = false,
}: Props) => {
  const editor = useRef(null);

  const config = useMemo(
    () => ({
      readonly: false,
      placeholder: placeholder || "Start writing your post…",
      minHeight: 150,
      toolbarAdaptive: false,
    }),
    [placeholder],
  );

  return (
    <>
      {label && (
        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <JoditEditor
        ref={editor}
        value={content}
        config={config}
        tabIndex={1}
        onBlur={(newContent: string) => setContent(newContent)}
      />
    </>
  );
};

export default JoditTextEditor;
