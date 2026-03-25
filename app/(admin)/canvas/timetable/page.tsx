'use client';

import { useState, useRef } from 'react';
import { Download, Edit, Save, Settings, Clock } from 'lucide-react';
import Image from 'next/image';
import { toPng, toJpeg } from 'html-to-image';
import jsPDF from 'jspdf';

interface CourseEntry {
  subject: string;
  room: string;
  duration: number;
}

type ScheduleData = {
  [day: string]: {
    [timeSlot: string]: CourseEntry | null;
  };
};

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const TIME_SLOTS = [
  { start: '08:30', end: '11:00' },
  { start: '11:00', end: '13:30' },
  { start: '13:30', end: '16:00' },
  { start: '16:00', end: '18:30' },
];

const FILIERES = [
  'Bâtiment',
  'Bâtiment option Métreur',
  'Génie Civil option Bâtiments',
  'Génie Civil option Travaux Publics',
  'Génie Civil',
  'Menuiserie',
  'Menuiserie Aluminium',
  'Menuiserie option Aluminium et Bois',
  'Développement Digital',
  'Développement Digital option Web Full Stack',
  'Infrastructure Digitale',
  'Infrastructure Digitale option Systèmes et Réseaux',
  'Assistant Administratif',
  'Assistant Administratif option Commerce',
  'Assistant Administratif option Comptabilité',
  'Gestion des Entreprises',
  'Gestion des Entreprises option Comptabilité et Finance',
  'Gestion des Entreprises option Commerce et Marketing',
  'Gestion des Entreprises option Ressources Humaines',
  'Electricité de Bâtiment',
  'Electricité Industrielle',
  'Génie électrique',
  'Génie électrique option Electronique, Automatisme et Robotique',
  'Génie électrique option Electromécanique des Systèmes Automatisés',
  'Ouvrier Qualifié en électricité',
  'Ouvrier Qualifié en électricité option Entretien Electrique',
  'Ouvrier Qualifié en électricité option Electromécanique',
  'Génie Mécanique',
  'Génie Mécanique option Etudes et Méthodes en Fabrication Mécanique',
  'Production mécanique',
  'Production mécanique option Régleur en Fabrication Mécanique',
  'Diagnostic et Electronique Embarquée Automobile',
  'Electromécanique des engins motorisés',
  'Electromécanique des engins motorisés option Automobile',
  'Réparateur de Véhicules Automobiles',
  'Technico-Commercial en Vente de Véhicules et Pièces de Rechange',
  'Programme d\'Innovation Entrepreneuriale : de l\'idée au projet viable',
  'Certification Microsoft Office Spécialiste en Excel',
  'Certification Microsoft Office Specialist en Word',
  'Management des parcs de loisirs',
];

export default function TimetablePage() {
  const [isEditMode, setIsEditMode] = useState(false);
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [scheduleData, setScheduleData] = useState<ScheduleData>({});
  const [editingCell, setEditingCell] = useState<{ day: string; slot: string } | null>(null);
  const [formData, setFormData] = useState({ subject: '', room: '', duration: 1 });
  const timetableRef = useRef<HTMLDivElement>(null);

  const [headerInfo, setHeaderInfo] = useState({
    academicYear: '2025/2026',
    groupName: 'DEVOWFS201',
    filiere: 'Développement Digital option Web Full Stack',
    location: 'Souss-Massa',
    institution: 'ISTA AIT MELLOUL',
  });

  const calculateTotalHours = () => {
    let total = 0;
    Object.values(scheduleData).forEach((dayData) => {
      Object.values(dayData).forEach((entry) => {
        if (entry) {
          total += entry.duration * 2.5;
        }
      });
    });
    return total;
  };

  const handleCellClick = (day: string, slot: string) => {
    if (!isEditMode) return;
    
    const key = `${day}-${slot}`;
    const existing = scheduleData[day]?.[slot];
    
    if (existing) {
      setFormData({
        subject: existing.subject,
        room: existing.room,
        duration: existing.duration,
      });
    } else {
      setFormData({ subject: '', room: '', duration: 1 });
    }
    
    setEditingCell({ day, slot });
  };

  const handleSaveCell = () => {
    if (!editingCell) return;
    
    const { day, slot } = editingCell;
    
    setScheduleData((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [slot]: formData.subject ? formData : null,
      },
    }));
    
    setEditingCell(null);
  };

  const handleDeleteCell = () => {
    if (!editingCell) return;
    
    const { day, slot } = editingCell;
    
    setScheduleData((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [slot]: null,
      },
    }));
    
    setEditingCell(null);
  };

  const handleDownloadImage = async () => {
    if (!timetableRef.current) return;
    
    try {
      // Wait a bit for any animations to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const dataUrl = await toPng(timetableRef.current, {
        cacheBust: true,
        pixelRatio: 3,
        backgroundColor: '#ffffff',
        width: timetableRef.current.scrollWidth,
        height: timetableRef.current.scrollHeight,
      });
      
      const link = document.createElement('a');
      link.download = `emploi-du-temps-${headerInfo.groupName}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Error generating image:', error);
      alert('Erreur lors de la génération de l\'image. Veuillez réessayer.');
    }
  };

  const handleDownloadPDF = async () => {
    if (!timetableRef.current) return;
    
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const dataUrl = await toPng(timetableRef.current, {
        cacheBust: true,
        pixelRatio: 3,
        backgroundColor: '#ffffff',
        width: timetableRef.current.scrollWidth,
        height: timetableRef.current.scrollHeight,
      });
      
      const img = new window.Image();
      img.src = dataUrl;
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
      
      // Calculate dimensions to fit A4 landscape
      const pdfWidth = 297; // A4 width in mm
      const pdfHeight = 210; // A4 height in mm
      const imgAspect = img.width / img.height;
      const pdfAspect = pdfWidth / pdfHeight;
      
      let finalWidth, finalHeight;
      if (imgAspect > pdfAspect) {
        finalWidth = pdfWidth;
        finalHeight = pdfWidth / imgAspect;
      } else {
        finalHeight = pdfHeight;
        finalWidth = pdfHeight * imgAspect;
      }
      
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });
      
      const xOffset = (pdfWidth - finalWidth) / 2;
      const yOffset = (pdfHeight - finalHeight) / 2;
      
      pdf.addImage(dataUrl, 'PNG', xOffset, yOffset, finalWidth, finalHeight);
      pdf.save(`emploi-du-temps-${headerInfo.groupName}-${Date.now()}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Erreur lors de la génération du PDF. Veuillez réessayer.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Controls */}
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Emploi du Temps</h1>
          <div className="flex gap-3">
            <button
              onClick={() => setIsEditingHeader(!isEditingHeader)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Horaires
            </button>
            <button
              onClick={() => setIsEditMode(!isEditMode)}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                isEditMode
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isEditMode ? (
                <>
                  <Save className="w-4 h-4" />
                  Terminer
                </>
              ) : (
                <>
                  <Edit className="w-4 h-4" />
                  Modifier
                </>
              )}
            </button>
            <button 
              onClick={handleDownloadImage}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Image
            </button>
            <button 
              onClick={handleDownloadPDF}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              PDF
            </button>
          </div>
        </div>

        {/* Timetable Container */}
        <div ref={timetableRef} data-timetable className="bg-white rounded-lg shadow-lg p-8">
          {/* Header Section */}
          <div className="mb-8 border-b-2 pb-6">
            <div className="flex items-start justify-between mb-4">
              {/* Left: Group and Total */}
              <div className="text-left">
                <p className="text-lg text-gray-700 mb-2">
                  Groupe : <span className="font-bold text-gray-900 text-xl">{headerInfo.groupName}</span>
                </p>
                <p className="text-lg text-gray-700">
                  Total : <span className="font-bold text-blue-600 text-xl">{calculateTotalHours()}H</span>
                </p>
              </div>

              {/* Center: Title and Info */}
              <div className="flex-1 text-center px-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-3">
                  Emploi du temps par groupe
                </h2>
                <p className="text-2xl font-semibold text-gray-800 mb-2">{headerInfo.academicYear}</p>
                <div className="mt-4 space-y-2">
                  <p className="text-base text-gray-600">{headerInfo.location}</p>
                  <p className="text-base font-semibold text-gray-700">{headerInfo.institution}</p>
                  <p className="text-base text-gray-700">
                    Filière : <span className="font-semibold">{headerInfo.filiere}</span>
                  </p>
                </div>
              </div>

              {/* Right: Logo */}
              <div className="flex items-center gap-3">
                <div className="w-24 h-24 rounded-lg flex items-center justify-center">
                  <Image 
                    src="/images/timetable_logo.png" 
                    alt="OFPPT" 
                    width={96} 
                    height={96}
                    className="object-contain"
                  />
                </div>
              </div>
            </div>

            {/* Edit Header Button */}
            {isEditingHeader && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Année académique</label>
                    <input
                      type="text"
                      value={headerInfo.academicYear}
                      onChange={(e) => setHeaderInfo({ ...headerInfo, academicYear: e.target.value })}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Groupe</label>
                    <input
                      type="text"
                      value={headerInfo.groupName}
                      onChange={(e) => setHeaderInfo({ ...headerInfo, groupName: e.target.value })}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">Filière</label>
                    <input
                      type="text"
                      list="filieres-list"
                      value={headerInfo.filiere}
                      onChange={(e) => setHeaderInfo({ ...headerInfo, filiere: e.target.value })}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      placeholder="Sélectionner ou saisir une filière"
                    />
                    <datalist id="filieres-list">
                      {FILIERES.map((filiere) => (
                        <option key={filiere} value={filiere} />
                      ))}
                    </datalist>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Timetable Grid - Days on RIGHT, Time slots REVERSED (18:30 to 08:30) */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border-2 border-gray-400">
              <thead>
                <tr className="bg-gray-200">
                  {[...TIME_SLOTS].reverse().map((slot, idx) => (
                    <th key={idx} className="border-2 border-gray-400 p-3 text-center bg-gray-100">
                      <div className="flex justify-between items-center text-base font-semibold px-3">
                        <span>{slot.end}</span>
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span>{slot.start}</span>
                      </div>
                    </th>
                  ))}
                  <th className="border-2 border-gray-400 p-4 text-center font-bold text-lg bg-gray-200">
                    Jour \ Horaire
                  </th>
                </tr>
              </thead>
              <tbody>
                {DAYS.map((day) => {
                  const reversedSlots = [...TIME_SLOTS].reverse();
                  const occupiedSlots = new Set<number>();
                  
                  // First pass: find all entries and mark occupied slots
                  reversedSlots.forEach((slot, idx) => {
                    const slotKey = `${slot.start}-${slot.end}`;
                    const entry = scheduleData[day]?.[slotKey];
                    if (entry && entry.duration > 1) {
                      // Mark the PREVIOUS slots as occupied (to the left, earlier times)
                      for (let i = 1; i < entry.duration && (idx - i) >= 0; i++) {
                        occupiedSlots.add(idx - i);
                      }
                    }
                  });
                  
                  return (
                    <tr key={day} className="hover:bg-gray-50">
                      {reversedSlots.map((slot, idx) => {
                        // Skip if this slot is occupied by a later entry's colspan
                        if (occupiedSlots.has(idx)) {
                          return null;
                        }
                        
                        const slotKey = `${slot.start}-${slot.end}`;
                        const entry = scheduleData[day]?.[slotKey];
                        
                        let colspan = 1;
                        if (entry && entry.duration > 1) {
                          // Span backwards (to earlier times, lower indices)
                          colspan = Math.min(entry.duration, idx + 1);
                        }
                        
                        return (
                          <td
                            key={idx}
                            colSpan={colspan}
                            className={`border-2 border-gray-400 p-4 text-center min-h-[100px] ${
                              isEditMode ? 'cursor-pointer hover:bg-blue-50' : ''
                            } ${entry ? 'bg-blue-50' : 'bg-white'}`}
                            onClick={() => handleCellClick(day, slotKey)}
                          >
                            {entry && (
                              <div className="space-y-2">
                                <div className="font-bold text-gray-900 text-base">{entry.subject}</div>
                                <div className="text-sm text-gray-600 italic">{entry.room}</div>
                              </div>
                            )}
                          </td>
                        );
                      })}
                      <td className="border-2 border-gray-400 p-4 font-semibold bg-gray-100 text-center text-base">
                        {day}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="text-sm text-gray-500 mt-6 text-center italic">
            Version peut être modifiée selon l'avancement des groupes
          </p>
        </div>
      </div>

      {/* Edit Modal */}
      {editingCell && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-xl font-bold mb-4">Modifier la séance</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Matière / Enseignant</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="Ex: BACHTI KHADIJA"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Salle</label>
                <input
                  type="text"
                  value={formData.room}
                  onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="Ex: INF02"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Durée (séances)</label>
                <select
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                >
                  <option value={1}>1 séance (2.5h)</option>
                  <option value={2}>2 séances (5h)</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSaveCell}
                className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
              >
                Sauvegarder
              </button>
              <button
                onClick={handleDeleteCell}
                className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700"
              >
                Supprimer
              </button>
              <button
                onClick={() => setEditingCell(null)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
