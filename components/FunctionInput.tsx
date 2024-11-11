// FunctionInput.tsx
import { useState } from 'react';

const FunctionInput = ({ onSubmit }: { onSubmit: (functionCode: string) => void }) => {
    const [functionCode, setFunctionCode] = useState('');

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        onSubmit(functionCode);
    };

    return (
        <form onSubmit={handleSubmit}>
            <textarea
                value={functionCode}
                onChange={(e) => setFunctionCode(e.target.value)}
                placeholder="Enter your function here"
                className="textarea"
            />
            <button type="submit">Visualize</button>
        </form>
    );
};

export default FunctionInput