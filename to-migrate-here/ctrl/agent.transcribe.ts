import { Request, Response, Router } from 'express';
import { createReadStream, unlinkSync, writeFileSync, existsSync } from 'fs';
import { upload } from '../middleware/upload';
import { jargonPrompt } from '../agents/SGC/prompts';
import { llmInstance, modelConfig } from 'agentic-api';
import { execSync } from 'child_process';
import path from 'path';

const router = Router();

/**
 * Supprime silencieusement un fichier (ignore les erreurs ENOENT)
 */
function safeUnlink(filePath: string): void {
  try {
    if (existsSync(filePath)) {
      unlinkSync(filePath);
    }
  } catch {
    // Ignorer silencieusement les erreurs de suppression
  }
}

/**
 * ✅ Convertir PCM brut en fichier WAV
 */
async function convertPcmToWav(
  pcmPath: string, 
  wavPath: string, 
  sampleRate: number = 16000, 
  channels: number = 1, 
  bitDepth: number = 16
): Promise<void> {
  const fs = require('fs');
  const pcmData = fs.readFileSync(pcmPath);
  
  // Calculer les paramètres WAV
  const byteRate = sampleRate * channels * (bitDepth / 8);
  const blockAlign = channels * (bitDepth / 8);
  const dataSize = pcmData.length;
  const fileSize = 36 + dataSize;
  
  // Créer le header WAV
  const header = Buffer.alloc(44);
  
  // RIFF header
  header.write('RIFF', 0);
  header.writeUInt32LE(fileSize, 4);
  header.write('WAVE', 8);
  
  // fmt chunk
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // fmt chunk size
  header.writeUInt16LE(1, 20);  // PCM format
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitDepth, 34);
  
  // data chunk
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);
  
  // Écrire le fichier WAV
  const wavData = Buffer.concat([header, pcmData]);
  fs.writeFileSync(wavPath, wavData);
}

const transcribeAudio = async (req: Request, res: Response): Promise<void> => {
  let audioPath = '';
  
  try {
    const audioFile = req.file as Express.Multer.File;
    const previousText = req.body.previousText || ''; // Transcription précédente pour contexte
    audioPath = audioFile.path;
    
    // ✅ Gestion des formats PCM et WAV
    if (audioFile.mimetype === 'audio/pcm') {
      // Convertir PCM en WAV pour OpenAI
      const wavPath = audioPath + '.wav';
      await convertPcmToWav(audioPath, wavPath, 16000, 1, 16); // 16kHz, mono, 16-bit
      safeUnlink(audioPath); // Supprimer le fichier PCM original
      audioPath = wavPath;
    } else if (audioFile.mimetype === 'audio/wav' && !audioPath.endsWith('.wav')) {
      const newPath = audioPath + '.wav';
      require('fs').renameSync(audioPath, newPath);
      audioPath = newPath;
    }
    
    // ✅ Vérification basique du fichier WAV
    const fs = require('fs');
    const fileBuffer = fs.readFileSync(audioPath);
    
    // Vérifier la taille minimale (44 bytes = header WAV minimum)
    if (fileBuffer.length < 44) {
      console.error('❌ Fichier WAV trop petit:', fileBuffer.length, 'bytes (minimum 44 bytes)');
      throw new Error(`Fichier WAV invalide: taille trop petite (${fileBuffer.length} bytes, minimum 44 bytes). Le chunk audio est probablement incomplet.`);
    }
    
    // Vérifier le header RIFF/WAVE
    const isValidWav = fileBuffer.toString('ascii', 0, 4) === 'RIFF' &&
                       fileBuffer.toString('ascii', 8, 12) === 'WAVE';
    
    if (!isValidWav) {
      console.error('❌ Header WAV invalide:', {
        riff: fileBuffer.toString('ascii', 0, 4),
        wave: fileBuffer.toString('ascii', 8, 12),
        size: fileBuffer.length
      });
      throw new Error(`Fichier WAV invalide ou corrompu: header RIFF/WAVE manquant ou incorrect. Taille: ${fileBuffer.length} bytes.`);
    }
    
    // Whisper est spécifique à OpenAI
    const openai = llmInstance({ provider: 'openai' });
    const whisperConfig = modelConfig("TRANSCRIBE", { provider: 'openai' });

    //
    // Construire le prompt avec jargon + transcription précédente pour contexte
    // Le paramètre prompt permet à Whisper d'utiliser le contexte pour améliorer
    // la cohérence entre les segments et éviter les répétitions
    // https://platform.openai.com/docs/guides/speech-to-text#prompting
    // https://cookbook.openai.com/examples/whisper_prompting_guide
    //
    // ⚠️ Le prompt doit être du TEXTE BRUT dans le style attendu, pas des instructions!
    // Whisper utilise ce texte pour adopter le style de ponctuation et reconnaître le vocabulaire.
    let prompt = jargonPrompt.trim();
    
    //
    // Ajouter la transcription précédente comme contexte si disponible
    // Simple concaténation: jargon (vocabulaire) + dernière phrase (style/continuité)
    if (previousText && previousText.trim()) {
      prompt = `${jargonPrompt.trim()} ${previousText.trim()}`;
    }

    //
    // Transcribe the audio with whisper-1 (modèle standard et testé)
    // https://platform.openai.com/docs/guides/speech-to-text
    const transcriptionResponse = await openai.audio.transcriptions.create({
      file: createReadStream(audioPath),
      model: whisperConfig.model,
      language: "fr",
      prompt: prompt.trim()
    });

    const transcription = transcriptionResponse.text.trim();
    safeUnlink(audioPath);
    res.json({ transcription });
  } catch (error: any) {
    // Nettoyer le fichier temporaire en cas d'erreur
    safeUnlink(audioPath);
    
    // Gestion spécifique des erreurs OpenAI
    if (error.message?.includes('Unsupported file format')) {
      res.status(400).json({ 
        error: '400 Unsupported file format',
        details: `Format ${req.file?.mimetype} non supporté par Whisper`,
        supportedFormats: ['audio/wav', 'audio/mp3', 'audio/m4a', 'audio/ogg']
      });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
};

router.post('/', upload.single('audio'), transcribeAudio);

export const ctrlTranscribe = router; 