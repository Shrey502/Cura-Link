// routes/search.js
const express = require('express');
const db = require('../db/db');
const authenticateToken = require('../middleware/authenticateToken');
const axios = require('axios');
const { XMLParser } = require("fast-xml-parser");
const router = express.Router();

// --- Search Publications ---
router.post('/publications', authenticateToken, async (req, res) => {
  const { searchTerm } = req.body;
  if (!searchTerm) {
    return res.status(400).json({ error: 'searchTerm is required' });
  }
  const pubmedSearchUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi';
  const pubmedFetchUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi';
  try {
    console.log(`Searching PubMed for: ${searchTerm}`);
    const searchResponse = await axios.get(pubmedSearchUrl, {
      params: { db: 'pubmed', term: searchTerm, retmode: 'json', retmax: 5 }
    });
    const paperIds = searchResponse.data.esearchresult.idlist;
    if (!paperIds || paperIds.length === 0) {
      return res.status(404).json({ message: 'No publications found.' });
    }
    console.log(`Fetching details for IDs: ${paperIds.join(',')}`);
    const fetchResponse = await axios.get(pubmedFetchUrl, {
      params: { db: 'pubmed', id: paperIds.join(','), retmode: 'xml' }
    });
    const parser = new XMLParser({ ignoreAttributes: true, textNodeName: "#text" });
    let articles = parser.parse(fetchResponse.data).PubmedArticleSet.PubmedArticle;
    if (articles && !Array.isArray(articles)) articles = [articles];
    if (!articles) return res.status(404).json({ message: 'Could not parse articles.' });
    let publications = [];
    for (const article of articles) {
      if (!article || !article.MedlineCitation) continue;
      const pubmedData = article.MedlineCitation;
      const articleData = pubmedData.Article;
      const title = (articleData.ArticleTitle && typeof articleData.ArticleTitle === 'object') ? articleData.ArticleTitle["#text"] : articleData.ArticleTitle;
      let abstractText = "";
      const abstractData = articleData.Abstract?.AbstractText;
      if (Array.isArray(abstractData)) {
        abstractText = abstractData.map(part => (part && typeof part === 'object' && part["#text"]) ? part["#text"] : (part || "")).join(' ');
      } else if (abstractData && typeof abstractData === 'object' && abstractData["#text"]) {
        abstractText = abstractData["#text"];
      } else if (typeof abstractData === 'string') {
        abstractText = abstractData;
      }
      if (!abstractText) continue;
      console.log(`Summarizing abstract for PMID: ${pubmedData.PMID}`);
      const hfUrl = 'https://api-inference.huggingface.co/models/facebook/bart-large-cnn';
      let aiSummary = "Summary not available.";
      try {
        const aiResponse = await axios.post(
          hfUrl,
          { "inputs": abstractText },
          { headers: { 'Authorization': `Bearer ${process.env.HF_API_KEY}`, 'Content-Type': 'application/json' } }
        );
        aiSummary = aiResponse.data[0].summary_text;
      } catch (aiError) {
        console.error(`AI summarization failed for PMID ${pubmedData.PMID}:`, aiError.message);
        if (aiError.response) console.error(aiError.response.data);
      }
      const year = articleData.Journal?.JournalIssue?.PubDate?.Year || '1970';
      const published_at = `${year}-01-01`;
      const pub = {
        id: pubmedData.PMID,
        title: title,
        abstract: abstractText,
        ai_summary: aiSummary,
        publication_url: `https://pubmed.ncbi.nlm.nih.gov/${pubmedData.PMID}/`,
        published_at: published_at
      };
      publications.push(pub);
      try {
        const saveQuery = `
          INSERT INTO publications (id, title, abstract, ai_summary, publication_url, published_at)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (id) DO NOTHING;
        `;
        await db.query(saveQuery, [pub.id, pub.title, pub.abstract, pub.ai_summary, pub.publication_url, pub.published_at]);
      } catch (dbError) {
        console.error(`Database save failed for PMID ${pub.id}:`, dbError.message);
      }
    }
    res.status(200).json(publications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching publications' });
  }
});

// --- Search Clinical Trials (FIXED FIELD NAME) ---
router.post('/trials', authenticateToken, async (req, res) => {
  const { searchTerm, statusFilter } = req.body;
  if (!searchTerm) {
    return res.status(400).json({ error: 'searchTerm is required' });
  }

  const trialsUrl = 'https://clinicaltrials.gov/api/v2/studies';

  try {
    console.log(`Searching ClinicalTrials.gov for: ${searchTerm}`);
    
    const apiParams = {
      'query.term': searchTerm,
      // --- THIS IS THE FIX ---
      'fields': 'NCTId,BriefTitle,BriefSummary,OverallStatus,LocationCity,LocationCountry,CentralContactEMail',
      // --- END OF FIX ---
      'format': 'json',
      'pageSize': 5
    };

    if (statusFilter && statusFilter !== 'ALL') {
      apiParams['filter.overallStatus'] = statusFilter.toUpperCase(); 
    }

    const searchResponse = await axios.get(trialsUrl, { params: apiParams });
    
    const studies = searchResponse.data.studies;
    if (!studies || studies.length === 0) {
      return res.status(404).json({ message: 'No clinical trials found.' });
    }

    let trials = [];

    for (const study of studies) {
      const trialId = study.protocolSection.identificationModule.nctId;
      const title = study.protocolSection.identificationModule.briefTitle;
      const summary = study.protocolSection.descriptionModule.briefSummary;
      const status = study.protocolSection.statusModule.overallStatus;
      
      const locations = study.protocolSection.contactsLocationsModule.locations;
      let locationString = 'N/A';
      if (locations && locations.length > 0) {
          locationString = `${locations[0].city}, ${locations[0].country}`;
      }
      
      // --- THIS IS THE FIX ---
      const email = study.protocolSection.contactsLocationsModule.centralContacts?.[0]?.eMail || 'N/A';
      // --- END OF FIX ---

      if (!summary) continue;

      console.log(`Summarizing trial: ${trialId}`);
      const hfUrl = 'https://api-inference.huggingface.co/models/facebook/bart-large-cnn';
      let aiSummary = "Summary not available.";

      try {
        const aiResponse = await axios.post(
          hfUrl,
          { "inputs": summary },
          { headers: { 'Authorization': `Bearer ${process.env.HF_API_KEY}` } }
        );
        aiSummary = aiResponse.data[0].summary_text;
      } catch (aiError) {
        console.error(`AI summarization failed for ${trialId}:`, aiError.message);
      }

      const trial = {
        id: trialId,
        title: title,
        description: summary,
        ai_summary: aiSummary,
        status: status,
        location: locationString,
        contact_email: email,
        trial_url: `https://clinicaltrials.gov/study/${trialId}`
      };
      
      trials.push(trial);

      try {
        const saveQuery = `
          INSERT INTO clinical_trials (id, title, description, ai_summary, status, location, contact_email, trial_url)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (id) DO NOTHING;
        `;
        await db.query(saveQuery, [
          trial.id, trial.title, trial.description, trial.ai_summary, 
          trial.status, trial.location, trial.contact_email, trial.trial_url
        ]);
      } catch (dbError) {
        console.error(`Database save failed for ${trial.id}:`, dbError.message);
      }
    }

    res.status(200).json(trials);

  } catch (err) {
    if (err.response && err.response.status === 400) {
      console.error("API returned 400. Bad Request. Check params.", err.response.data);
      return res.status(500).json({ error: "Trial search service failed. Bad parameters." });
    }
    console.error(err);
    res.status(500).json({ error: 'Server error fetching trials' });
  }
});

// --- Search Health Experts (Researchers) ---
router.post('/experts', authenticateToken, async (req, res) => {
  const { searchTerm } = req.body;
  if (!searchTerm) {
    return res.status(400).json({ error: 'searchTerm is required' });
  }

  try {
    // We'll search for the term in the full_name, specialties, or research_interests
    // The 'ilike' command is case-insensitive
    // The '->>' operator is for searching inside JSONB text
    const query = `
      SELECT user_id, full_name, specialties, research_interests
      FROM researcher_profiles
      WHERE 
        full_name ILIKE $1 OR
        specialties::text ILIKE $1 OR
        research_interests::text ILIKE $1;
    `;
    
    // Add '%' wildcards for a "contains" search
    const results = await db.query(query, [`%${searchTerm}%`]);
    
    res.status(200).json(results.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching experts' });
  }
});

module.exports = router;

