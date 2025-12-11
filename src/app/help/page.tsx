import Navbar from '@/components/Navbar';
import { Info, Shield, List, HelpCircle } from 'lucide-react';

export default function HelpPage() {
    const levels = [
        { id: 'N0', title: 'Sin IA', desc: 'Contenido creado 100% por humanos. Puede incluir herramientas digitales básicas (corrector ortográfico, filtros de color) pero no generativas.' },
        { id: 'N1', title: 'Guión IA', desc: 'La IA se utilizó para generar ideas, estructuras o borradores iniciales, pero el contenido final fue redactado o creado por humanos.' },
        { id: 'N2', title: 'Coautor', desc: 'Trabajo colaborativo donde tanto la IA como el humano tienen un peso significativo en la creación final.' },
        { id: 'N3', title: 'Predominante IA', desc: 'El contenido es generado principalmente por IA, con supervisión, selección y edición por parte de un humano.' },
        { id: 'N4', title: 'Sintético', desc: 'Contenido generado enteramente por IA sin modificaciones humanas sustanciales.' },
    ];

    return (
        <>
            <Navbar />

            <div className="w-full max-w-4xl px-4 mt-12 mb-20">
                <h1 className="text-3xl font-bold mb-2">Centro de Ayuda</h1>
                <p className="text-slate-400 mb-8">Entiende cómo funciona N0N4 y el protocolo de autenticidad.</p>

                <div className="space-y-12">

                    {/* C2PA Section */}
                    <section className="glass-panel p-8">
                        <div className="flex items-center gap-3 mb-4">
                            <Shield className="text-blue-400" size={28} />
                            <h2 className="text-2xl font-bold">¿Qué es el Protocolo C2PA?</h2>
                        </div>
                        <p className="text-slate-300 leading-relaxed">
                            La <strong>Coalition for Content Provenance and Authenticity (C2PA)</strong> es un estándar técnico abierto que permite a los editores incrustar metadatos a prueba de manipulaciones en archivos multimedia.
                            <br /><br />
                            Esto permite verificar quién creó el contenido, cuándo se creó y qué herramientas se utilizaron. En N0N4, utilizamos este protocolo para "firmar" digitalmente tu declaración de uso de IA, asegurando que nadie pueda alterar esa información posteriormente sin romper la firma digital.
                        </p>
                    </section>

                    {/* Levels Section */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <List className="text-purple-400" size={28} />
                            <h2 className="text-2xl font-bold">Los 5 Niveles de IA</h2>
                        </div>

                        <div className="grid gap-4">
                            {levels.map((l) => (
                                <div key={l.id} className="glass-panel p-6 flex gap-4 items-start">
                                    <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center font-bold text-xl shrink-0 border border-white/10">
                                        {l.id}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white mb-1">{l.title}</h3>
                                        <p className="text-slate-400 text-sm">{l.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* FAQ */}
                    <section className="glass-panel p-8">
                        <div className="flex items-center gap-3 mb-4">
                            <HelpCircle className="text-orange-400" size={28} />
                            <h2 className="text-2xl font-bold">Preguntas Frecuentes</h2>
                        </div>
                        <div className="space-y-6">
                            <div>
                                <h4 className="font-bold text-white mb-2">¿Cómo funcionan los créditos?</h4>
                                <p className="text-slate-400 text-sm">Cada vez que proteges un archivo, se consume 1 crédito de tu balance. La verificación de archivos es gratuita e ilimitada.</p>
                            </div>
                            <div>
                                <h4 className="font-bold text-white mb-2">¿Dónde se guardan los archivos?</h4>
                                <p className="text-slate-400 text-sm">N0N4 procesa la firma en tu navegador (o servidor seguro) y te devuelve el archivo. Nosotros NO almacenamos tus archivos permanentemente; tú eres responsable de guardarlos en local tras la descarga.</p>
                            </div>
                        </div>
                    </section>

                </div>
            </div>
        </>
    );
}
