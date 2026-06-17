"use client";

import React, { useEffect, useState } from 'react';
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, Font } from '@react-pdf/renderer';

// Register a font for that grimoire aesthetic
Font.register({
  family: 'Oswald',
  src: 'https://fonts.gstatic.com/s/oswald/v13/Y_TKV6o8WovbUd3m_X9aAA.ttf'
});

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FAF9F6', // Off-white parchment look
    padding: 40,
    fontFamily: 'Helvetica',
  },
  cover: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  coverTitle: {
    fontSize: 48,
    color: '#ffffff',
    fontFamily: 'Oswald',
    marginBottom: 20,
    letterSpacing: 4,
  },
  coverSubtitle: {
    fontSize: 24,
    color: '#d4af37', // Gold
    fontFamily: 'Oswald',
    letterSpacing: 2,
  },
  coverModule: {
    fontSize: 18,
    color: '#888888',
    marginTop: 40,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    fontFamily: 'Oswald',
    color: '#1a1a1a',
    borderBottomWidth: 2,
    borderBottomColor: '#d4af37',
    paddingBottom: 5,
  },
  block: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#ffffff',
    borderLeftWidth: 3,
    borderLeftColor: '#8b0000', // Dark red
  },
  text: {
    fontSize: 12,
    lineHeight: 1.5,
    color: '#333333',
  },
  masteryTitle: {
    fontSize: 16,
    fontFamily: 'Oswald',
    color: '#8b0000',
    marginTop: 30,
    marginBottom: 10,
  },
  masteryText: {
    fontSize: 10,
    color: '#666666',
    fontStyle: 'italic',
  }
});

interface VaultCategory {
  name: string;
  items: string[];
}

interface CodexProps {
  moduleName: string;
  categories: VaultCategory[];
}

const CodexDocument = ({ moduleName, categories }: CodexProps) => {
  // Calculate total blocks for the Mastery summary
  const totalBlocks = categories.reduce((acc, cat) => acc + cat.items.length, 0);

  return (
    <Document>
      <Page size="A4" style={styles.cover}>
        <Text style={styles.coverTitle}>CODEX MATHEMATICA</Text>
        <Text style={styles.coverSubtitle}>MASTERY BY VOLUME</Text>
        <Text style={styles.coverModule}>{moduleName}</Text>
      </Page>
      {categories.length > 0 ? (
        categories.map((cat, idx) => (
          <Page key={idx} size="A4" style={styles.page}>
            <Text style={styles.title}>{cat.name}</Text>
            {cat.items.map((item, i) => (
              <View key={i} style={styles.block}>
                {/* Rendering raw markdown in PDF for now since markdown-to-pdf react components are limited. */}
                <Text style={styles.text}>{item}</Text>
              </View>
            ))}
            {idx === categories.length - 1 && (
              <View style={{ marginTop: 40, borderTopWidth: 1, borderTopColor: '#cccccc', paddingTop: 20 }}>
                <Text style={styles.masteryTitle}>MASTERY SUMMARY</Text>
                <Text style={styles.masteryText}>This codex contains {totalBlocks} distilled blocks of knowledge.</Text>
                <Text style={styles.masteryText}>"True understanding is found in the relentless pursuit of foundational truths."</Text>
              </View>
            )}
          </Page>
        ))
      ) : (
        <Page size="A4" style={styles.page}>
          <Text style={styles.title}>Empty Codex</Text>
          <Text style={styles.text}>No knowledge has been inscribed in this module yet.</Text>
        </Page>
      )}
    </Document>
  );
};

export function CodexExportButton({ moduleName, categories }: CodexProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  return (
    <PDFDownloadLink 
      document={<CodexDocument moduleName={moduleName} categories={categories} />} 
      fileName={`Codex_${moduleName.replace(/\s+/g, '_')}.pdf`}
      className="flex items-center justify-center gap-2 text-sm font-medium text-amber-600 hover:text-amber-500 hover:bg-amber-500/10 transition-colors px-3 py-2 rounded-lg border border-amber-500/30"
    >
      {({ loading }) => (
        loading ? 'Inscribing Codex...' : 'Export Codex PDF'
      )}
    </PDFDownloadLink>
  );
}
