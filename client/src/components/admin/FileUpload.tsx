import { useState, useRef } from 'react';
import { HiOutlineCloudArrowUp, HiOutlinePhoto, HiXMark } from 'react-icons/hi2';

interface Props {
  files: File[];
  onChange: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  label?: string;
}

export default function FileUpload({ files, onChange, accept = 'image/*', multiple = true, label = 'Загрузить фото' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const addFiles = (newFiles: FileList | File[]) => {
    const arr = Array.from(newFiles).filter((f) => f.type.startsWith('image/'));
    onChange(multiple ? [...files, ...arr] : arr.slice(0, 1));
  };

  const removeFile = (index: number) => {
    onChange(files.filter((_, i) => i !== index));
  };

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
        }}
        className={`relative flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl px-4 py-6 cursor-pointer transition-colors ${
          dragOver
            ? 'border-[#C4A882] bg-[#F5F0EB]'
            : 'border-[#E5E5E3] hover:border-[#C4A882] hover:bg-gray-50/50'
        }`}
      >
        <HiOutlineCloudArrowUp className={`w-8 h-8 transition-colors ${dragOver ? 'text-[#C4A882]' : 'text-[#6B6B6B]'}`} />
        <div className="text-center">
          <p className="text-sm font-medium text-[#1A1A1A]">{label}</p>
          <p className="text-xs text-[#6B6B6B] mt-0.5">Нажмите или перетащите файлы сюда</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ''; }}
          className="hidden"
        />
      </div>

      {files.length > 0 && (
        <div className="flex gap-2 flex-wrap mt-3">
          {files.map((file, i) => (
            <div key={i} className="relative group">
              <div className="w-16 h-20 rounded-lg overflow-hidden bg-[#F5F0EB] flex items-center justify-center">
                <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
              </div>
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="absolute -top-1.5 -right-1.5 bg-red-500 text-white w-5 h-5 rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
              >
                <HiXMark className="w-3 h-3" />
              </button>
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent text-white text-[9px] px-1 py-0.5 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                <HiOutlinePhoto className="w-2.5 h-2.5 inline mr-0.5" />
                {file.name}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
