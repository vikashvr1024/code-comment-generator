import React, { useState, useEffect } from 'react';
import {
  Container,
  TextField,
  Button,
  Paper,
  Typography,
  Box,
  CircularProgress,
  IconButton,
  Chip,
  Fade,
  Tooltip,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Delete as ClearIcon,
  Code as CodeIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { jsPDF } from 'jspdf';

// Comprehensive language detection patterns
const LANGUAGE_PATTERNS = {
  python: {
    name: 'Python',
    patterns: {
      keywords: [
        'def ', 'class ', 'import ', 'from ', 'as ', 'with ', 'if __name__', 'print(', 'return ', 'yield ', 'raise ',
        'except ', 'try:', 'except:', 'finally:', 'async def', 'await ', 'lambda ', '@property', '@staticmethod',
        'self.', '__init__', 'pass\n', 'None', 'True', 'False', 'and ', 'or ', 'not ', 'is ', 'in '
      ],
      syntax: [':', '\n    ', '#', '"""', "'''", '->', '+=', '-=', '*=', '/=', '%=', '//='],
      imports: [
        'import numpy', 'import pandas', 'import tensorflow', 'from django', 'import flask',
        'import os', 'import sys', 'import json', 'import requests', 'from datetime import',
        'import matplotlib', 'import scipy', 'import torch', 'import pytest'
      ],
      fileExtensions: ['.py', '.pyw', '.pyc', '.pyo', '.pyd'],
    }
  },
  javascript: {
    name: 'JavaScript',
    patterns: {
      keywords: [
        'function ', 'const ', 'let ', 'var ', '=>', 'class ', 'export ', 'import ', 'return ', 'await ', 'async ',
        'typeof ', 'instanceof ', 'new ', 'this.', 'super', 'extends ', 'static ', 'get ', 'set ', 'null',
        'undefined', 'console.log', 'process.', 'window.', 'document.', 'prototype.', 'constructor'
      ],
      syntax: ['{', '}', '//', '/*', '*/', '===', '!==', '+=', '-=', '*=', '/=', '??', '?.', '||=', '&&='],
      imports: [
        'require(', 'import ', 'from ', 'export ',
        'import React', 'import {', 'from "react"', 'from "express"',
        'from "@material-ui', 'from "axios"', 'from "lodash"'
      ],
      fileExtensions: ['.js', '.jsx', '.mjs', '.cjs'],
    }
  },
  typescript: {
    name: 'TypeScript',
    patterns: {
      keywords: [
        'interface ', 'type ', 'namespace ', 'enum ', 'implements ', 'declare ', 'readonly ',
        'public ', 'private ', 'protected ', 'abstract ', 'as ', 'is ', 'keyof ', 'typeof ',
        'Pick<', 'Omit<', 'Partial<', 'Required<', 'Record<', 'unknown', 'never', 'void'
      ],
      syntax: [': ', '=>', '<>', '{}', '|', '&', 'as const', '<T>', '<K, V>'],
      imports: [
        'import {', 'from "react"', 'from "@types/', 'from "next"',
        'import type ', 'type Props = {', 'interface Props {'
      ],
      fileExtensions: ['.ts', '.tsx', '.d.ts'],
    }
  },
  java: {
    name: 'Java',
    patterns: {
      keywords: [
        'public class ', 'private ', 'protected ', 'class ', 'interface ', 'extends ', 'implements ', 'void ',
        'static ', 'final ', 'abstract ', 'synchronized ', 'volatile ', 'transient ', 'native ',
        'System.out.println', 'new ArrayList', 'new HashMap', '@Override', '@Autowired', '@Component',
        'public static void main'
      ],
      syntax: ['{', '}', '//', '/*', '*/', ';', '+=', '-=', '*=', '/=', '%=', '<>', '[]'],
      imports: [
        'import java.', 'import javax.', 'import org.springframework.', 'import com.google.',
        'import lombok.', 'package ', 'import android.', 'import junit.'
      ],
      fileExtensions: ['.java', '.jar', '.class', '.jsp'],
    }
  },
  kotlin: {
    name: 'Kotlin',
    patterns: {
      keywords: ['fun ', 'val ', 'var ', 'companion object', 'data class', 'sealed class', 'object '],
      syntax: ['{', '}', '//', '/*', '*/'],
      imports: ['import kotlin.', 'package '],
      fileExtensions: ['.kt', '.kts'],
    }
  },
  swift: {
    name: 'Swift',
    patterns: {
      keywords: ['func ', 'var ', 'let ', 'guard ', 'protocol ', 'extension ', 'enum '],
      syntax: ['{', '}', '//', '/*', '*/'],
      imports: ['import Foundation', 'import UIKit'],
      fileExtensions: ['.swift'],
    }
  },
  cpp: {
    name: 'C++',
    patterns: {
      keywords: [
        '#include', 'using namespace', 'class ', 'template', 'public:', 'private:', 'protected:',
        'std::', 'cout', 'cin', 'endl', 'vector<', 'string', 'const ', 'virtual ', 'friend ',
        'operator ', 'new ', 'delete ', 'nullptr', 'int main(', 'void main('
      ],
      syntax: ['::', '->', '{', '}', '//', '/*', '*/', '<<', '>>', '+=', '-=', '*=', '/=', '%='],
      imports: [
        '#include <iostream>', '#include <string>', '#include <vector>', '#include <map>',
        '#include <algorithm>', '#include <memory>', '#include <cstdio>', '#include "', '#pragma once'
      ],
      fileExtensions: ['.cpp', '.hpp', '.cc', '.h', '.cxx', '.c++'],
    }
  },
  csharp: {
    name: 'C#',
    patterns: {
      keywords: [
        'namespace ', 'using System', 'class ', 'public ', 'private ', 'protected ', 'async ', 'await ',
        'var ', 'string ', 'int ', 'bool ', 'void ', 'static ', 'readonly ', 'sealed ', 'override ',
        'Console.WriteLine', 'Debug.Log', 'List<', 'Dictionary<', '[SerializeField]', '[Serializable]'
      ],
      syntax: ['{', '}', '//', '/*', '*/', ';', '+=', '-=', '*=', '/=', '%=', '=>', '?.', '??'],
      imports: [
        'using System', 'using Microsoft', 'using UnityEngine', 'using System.Collections',
        'using System.Linq', 'using System.Threading.Tasks', 'using System.Text'
      ],
      fileExtensions: ['.cs', '.cshtml', '.csx'],
    }
  },
  php: {
    name: 'PHP',
    patterns: {
      keywords: [
        '<?php', 'function ', 'class ', 'public ', 'private ', 'protected ', 'namespace ',
        '$this->', 'echo ', 'print ', 'require ', 'include ', 'array(', '[]', 'null',
        '__construct', '__get', '__set', 'extends ', 'implements '
      ],
      syntax: ['->', '=>', '<?', '?>', '{', '}', '//', '/*', '*/', '$', '::'],
      imports: [
        'use ', 'namespace ', 'require_once ', 'include_once ',
        'use Illuminate\\', 'use App\\', 'use PHPUnit\\', 'use Symfony\\'
      ],
      fileExtensions: ['.php', '.phtml', '.php3', '.php4', '.php5', '.phps'],
    }
  },
  ruby: {
    name: 'Ruby',
    patterns: {
      keywords: ['def ', 'class ', 'module ', 'require ', 'include ', 'attr_', 'puts '],
      syntax: ['end', '#', '=begin', '=end'],
      imports: ['require ', 'include ', 'extend '],
      fileExtensions: ['.rb', '.rake'],
    }
  },
  go: {
    name: 'Go',
    patterns: {
      keywords: ['func ', 'type ', 'struct ', 'interface ', 'package ', 'import ', 'var ', 'const '],
      syntax: ['{', '}', '//', '/*', '*/'],
      imports: ['import (', 'package '],
      fileExtensions: ['.go'],
    }
  },
  rust: {
    name: 'Rust',
    patterns: {
      keywords: ['fn ', 'let ', 'mut ', 'struct ', 'impl ', 'trait ', 'pub ', 'use '],
      syntax: ['{', '}', '//', '/*', '*/', '::'],
      imports: ['use ', 'mod ', 'extern crate'],
      fileExtensions: ['.rs'],
    }
  },
  scala: {
    name: 'Scala',
    patterns: {
      keywords: ['object ', 'class ', 'trait ', 'def ', 'val ', 'var ', 'case class'],
      syntax: ['{', '}', '//', '/*', '*/'],
      imports: ['import ', 'package '],
      fileExtensions: ['.scala'],
    }
  },
  r: {
    name: 'R',
    patterns: {
      keywords: ['function(', 'library(', 'if(', 'for(', 'while('],
      syntax: ['<-', '#', '{', '}'],
      imports: ['library(', 'require('],
      fileExtensions: ['.r', '.R'],
    }
  },
  matlab: {
    name: 'MATLAB',
    patterns: {
      keywords: ['function ', 'end', 'if ', 'for ', 'while '],
      syntax: ['%', '...'],
      imports: [],
      fileExtensions: ['.m'],
    }
  },
  sql: {
    name: 'SQL',
    patterns: {
      keywords: ['SELECT ', 'FROM ', 'WHERE ', 'INSERT INTO ', 'UPDATE ', 'DELETE ', 'CREATE TABLE'],
      syntax: ['--', '/*', '*/', ';'],
      imports: [],
      fileExtensions: ['.sql'],
    }
  },
  html: {
    name: 'HTML',
    patterns: {
      keywords: ['<!DOCTYPE', '<html', '<head', '<body', '<div', '<span', '<p'],
      syntax: ['<', '>', '/>'],
      imports: ['<link', '<script'],
      fileExtensions: ['.html', '.htm'],
    }
  },
  css: {
    name: 'CSS',
    patterns: {
      keywords: ['body', 'div', 'class', 'id', '@media', '@import', '@keyframes'],
      syntax: ['{', '}', ';', ':'],
      imports: ['@import'],
      fileExtensions: ['.css', '.scss', '.sass', '.less'],
    }
  },
  shell: {
    name: 'Shell Script',
    patterns: {
      keywords: ['#!/bin/', 'echo ', 'if ', 'then ', 'fi ', 'for ', 'while ', 'case '],
      syntax: ['$', '#', '||', '&&'],
      imports: ['source ', '. '],
      fileExtensions: ['.sh', '.bash'],
    }
  },
};

function App() {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('');
  const [commentedCode, setCommentedCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Enhanced language detection function
  const detectLanguage = (code) => {
    if (!code.trim()) return '';

    // Calculate scores for each language
    const scores = Object.entries(LANGUAGE_PATTERNS).map(([langKey, langData]) => {
      let score = 0;
      const { patterns } = langData;
      const codeLength = code.length;

      // Check for keywords (higher weight)
      patterns.keywords.forEach(keyword => {
        const matches = (code.match(new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
        score += matches * 4; // Increased weight for keywords
      });

      // Check for syntax patterns (medium weight)
      patterns.syntax.forEach(syntax => {
        const matches = (code.match(new RegExp(syntax.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
        score += matches * 2;
      });

      // Check for imports (highest weight)
      patterns.imports.forEach(importPattern => {
        const matches = (code.match(new RegExp(importPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
        score += matches * 6; // Increased weight for imports
      });

      // Check for file extensions in code or comments
      patterns.fileExtensions.forEach(ext => {
        const matches = (code.match(new RegExp(ext.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
        score += matches * 2;
      });

      // Normalize score based on code length to avoid bias towards longer code snippets
      const normalizedScore = (score / Math.sqrt(codeLength)) * 100;

      // Bonus points for distinctive patterns
      if (langKey === 'python' && code.includes('    ')) score += 20; // Python indentation
      if (langKey === 'javascript' && code.includes('===')) score += 20; // JavaScript strict equality
      if (langKey === 'php' && code.includes('<?php')) score += 30; // PHP opening tag
      if (langKey === 'ruby' && code.includes('end\n')) score += 20; // Ruby block endings
      if (langKey === 'java' && code.includes('public static void main')) score += 30; // Java main method
      if (langKey === 'cpp' && code.includes('int main(')) score += 30; // C++ main function
      if (langKey === 'csharp' && code.includes('Console.WriteLine')) score += 20; // C# console output

      return {
        language: langKey,
        name: langData.name,
        score: normalizedScore
      };
    });

    // Sort by score and get the highest
    const detected = scores.sort((a, b) => b.score - a.score)[0];
    
    // Only return a detected language if the score is above a certain threshold
    return detected.score > 10 ? detected : { language: 'unknown', name: 'Unknown', score: 0 };
  };

  const handleGenerateComments = async () => {
    if (!code.trim()) {
      setError('Please enter some code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const detectedLang = detectLanguage(code);
      
      const response = await axios.post('http://localhost:5000/api/generate-comments', {
        code: code,
        language: detectedLang.language === 'unknown' ? 'general' : detectedLang.language
      });
      setCommentedCode(response.data.commentedCode);
    } catch (err) {
      setError('Failed to generate comments. Please try again.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setCode('');
    setCommentedCode('');
    setError('');
    setLanguage('');
  };

  const handleDownloadPdf = () => {
    const doc = new jsPDF();
    doc.setFont('Courier');
    doc.setFontSize(12);
    doc.text(`Commented Code - ${language.toUpperCase()} - ${new Date().toLocaleDateString()}`, 10, 10);
    const lines = commentedCode.split('\n');
    let y = 20;
    lines.forEach((line) => {
      if (line.length > 80) {
        const chunks = line.match(/.{1,80}/g) || [];
        chunks.forEach(chunk => {
          doc.text(chunk, 10, y);
          y += 7;
        });
      } else {
        doc.text(line, 10, y);
        y += 7;
      }
      if (y > 280) {
        doc.addPage();
        y = 10;
      }
    });
    doc.save(`commented_code_${language || 'code'}.pdf`);
  };

  useEffect(() => {
    if (code.trim()) {
      const detected = detectLanguage(code);
      setLanguage(detected.name);
    } else {
      setLanguage('');
    }
  }, [code]);

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(120deg, #f0f2f5 0%, #e3e8ef 100%)',
      py: 4
    }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          mb: 4,
          gap: 2
        }}>
          <CodeIcon sx={{ fontSize: 40, color: '#1976d2' }} />
          <Typography 
            variant="h2" 
            component="h1" 
            sx={{
              fontWeight: 600,
              background: 'linear-gradient(45deg, #1976d2, #64b5f6)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
            }}
          >
            Code Comment Generator
          </Typography>
        </Box>

        <Box sx={{ 
          display: 'flex', 
          gap: 3, 
          flexDirection: { xs: 'column', md: 'row' }
        }}>
          {/* Input Section */}
          <Paper 
            elevation={3} 
            sx={{ 
              flex: 1,
              p: 3,
              borderRadius: 2,
              background: 'white',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: 6,
              }
            }}
          >
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ color: '#1976d2' }}>
                Input Code
              </Typography>
              {language && (
                <Fade in={true}>
                  <Chip
                    icon={<CodeIcon />}
                    label={`Detected: ${language}`}
                    color="primary"
                    variant="outlined"
                    sx={{ borderRadius: 1 }}
                  />
                </Fade>
              )}
            </Box>

            <TextField
              fullWidth
              multiline
              rows={15}
              variant="outlined"
              placeholder="Paste your code here..."
              value={code}
              onChange={(e) => setCode(e.target.value)}
              sx={{ 
                mb: 2,
                '& .MuiInputBase-input': {
                  fontFamily: 'Consolas, monospace',
                  fontSize: '14px',
                },
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1,
                  '&:hover fieldset': {
                    borderColor: '#1976d2',
                  },
                }
              }}
            />

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                onClick={handleGenerateComments}
                disabled={loading}
                sx={{
                  borderRadius: 1,
                  textTransform: 'none',
                  px: 3,
                  py: 1,
                  bgcolor: '#1976d2',
                  '&:hover': {
                    bgcolor: '#1565c0',
                  }
                }}
              >
                {loading ? (
                  <CircularProgress size={24} sx={{ color: 'white' }} />
                ) : (
                  'Generate Comments'
                )}
              </Button>
              <Tooltip title="Clear all">
                <Button
                  variant="outlined"
                  onClick={handleClear}
                  startIcon={<ClearIcon />}
                  sx={{
                    borderRadius: 1,
                    textTransform: 'none',
                  }}
                >
                  Clear
                </Button>
              </Tooltip>
            </Box>

            {error && (
              <Fade in={true}>
                <Typography 
                  color="error" 
                  sx={{ 
                    mt: 2,
                    p: 1,
                    borderRadius: 1,
                    bgcolor: '#ffebee'
                  }}
                >
                  {error}
                </Typography>
              </Fade>
            )}
          </Paper>

          {/* Output Section */}
          <Paper 
            elevation={3} 
            sx={{ 
              flex: 1,
              p: 3,
              borderRadius: 2,
              background: 'white',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: 6,
              }
            }}
          >
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              mb: 2 
            }}>
              <Typography variant="h6" sx={{ color: '#1976d2' }}>
                Commented Code
              </Typography>
              {commentedCode && (
                <Tooltip title="Download as PDF">
                  <IconButton 
                    onClick={handleDownloadPdf} 
                    sx={{
                      bgcolor: '#e3f2fd',
                      '&:hover': {
                        bgcolor: '#bbdefb',
                      }
                    }}
                  >
                    <DownloadIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Box>

            <Paper 
              variant="outlined"
              sx={{ 
                p: 2,
                maxHeight: '500px',
                overflow: 'auto',
                borderRadius: 1,
                bgcolor: '#fafafa',
                '& pre': {
                  margin: 0,
                  fontFamily: 'Consolas, monospace',
                  fontSize: '14px',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                }
              }}
            >
              <pre>
                <code>
                  {commentedCode || '// Generated comments will appear here'}
                </code>
              </pre>
            </Paper>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
}

export default App;
