import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';

export default function PublicShell({ children }) {
  return (
    <div className="min-h-screen bg-white">
      {children}
    </div>
  );
}