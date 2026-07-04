'use client';

import React from 'react';
import { ResearchData } from '@/types';
import { generatePDF } from '@/utils/pdf';
import { Download } from 'lucide-react';
import styles from './Report.module.css';

interface Props {
  data: ResearchData;
}

export default function ReportView({ data }: Props) {
  const { company, report } = data;

  if (!report) {
    return (
      <div className={styles.reportContainer}>
        <p>No report generated.</p>
      </div>
    );
  }

  return (
    <div className={styles.reportContainer}>
      <div className={styles.header}>
        <div>
          <h2 className={`${styles.title} font-display`}>{company.name}</h2>
          <div className={styles.meta}>
            {company.website && (
              <span>Website: <a href={company.website} target="_blank" rel="noreferrer">{company.website}</a></span>
            )}
            {company.phone && <span>Phone: {company.phone}</span>}
            {company.address && <span>Address: {company.address}</span>}
          </div>
        </div>
        <button onClick={() => generatePDF(data)} className={styles.btnDownload}>
          <Download size={16} />
          Download PDF
        </button>
      </div>

      <div className={styles.section}>
        <h3 className={`${styles.sectionTitle} font-mono`}>Executive Summary</h3>
        <p className={styles.summaryText}>{report.summary}</p>
      </div>

      {report.products && report.products.length > 0 && (
        <div className={styles.section}>
          <h3 className={`${styles.sectionTitle} font-mono`}>Products</h3>
          <ul className={styles.gridList}>
            {report.products.map((p, i) => <li key={i} className={styles.gridItem}>{p}</li>)}
          </ul>
        </div>
      )}

      {report.services && report.services.length > 0 && (
        <div className={styles.section}>
          <h3 className={`${styles.sectionTitle} font-mono`}>Services</h3>
          <ul className={styles.gridList}>
            {report.services.map((s, i) => <li key={i} className={styles.gridItem}>{s}</li>)}
          </ul>
        </div>
      )}

      {report.pain_points && report.pain_points.length > 0 && (
        <div className={styles.section}>
          <h3 className={`${styles.sectionTitle} font-mono`}>Customer Pain Points</h3>
          <ul className={styles.gridList}>
            {report.pain_points.map((p, i) => <li key={i} className={styles.gridItem}>{p}</li>)}
          </ul>
        </div>
      )}

      {report.competitors && report.competitors.length > 0 && (
        <div className={styles.section}>
          <h3 className={`${styles.sectionTitle} font-mono`}>Competitors</h3>
          <ul className={styles.gridList}>
            {report.competitors.map((c, i) => (
              <li key={i} className={styles.competitorItem}>
                <span className={styles.competitorName}>{c.name}</span>
                {c.website ? (
                  <a href={c.website} target="_blank" rel="noreferrer" className={styles.competitorWebsite}>{c.website}</a>
                ) : (
                  <span className={styles.competitorWebsite}>Website unknown</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
