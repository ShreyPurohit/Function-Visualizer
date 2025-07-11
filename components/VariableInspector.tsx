'use client';

import { m } from 'framer-motion';

interface VariableInspectorProps {
    variables: Record<string, any>;
}

const VariableInspector: React.FC<VariableInspectorProps> = ({ variables }) => {
    return (
        <div className="space-y-2">
            {Object.keys(variables).length === 0 ? (
                <p className="text-gray-400 italic">No variables declared yet.</p>
            ) : (
                Object.entries(variables).map(([key, value]) => (
                    <m.div
                        key={key}
                        layout
                        className="flex justify-between items-center bg-gray-100 px-3 py-2 rounded-md shadow-sm text-sm"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <span className="font-mono text-blue-700 font-semibold">{key}</span>
                        <span className="font-mono text-right text-gray-700">
                            {JSON.stringify(value)}
                        </span>
                    </m.div>
                ))
            )}
        </div>
    );
};

export default VariableInspector;
