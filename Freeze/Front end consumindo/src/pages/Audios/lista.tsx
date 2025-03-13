import React from "react";
import Header from "@/components/Header";
import AudioList from "@/components/AudioList";
import Footer from "@/components/Footer-sistema";

const ListaAudiosPage = () => {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-8">
          Áudios Analisados
        </h1>
        <AudioList />
      </main>
      <Footer />
    </div>
  );
};

export default ListaAudiosPage;
