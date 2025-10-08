import Head from 'next/head';

export default function Home() {
  return (
    <>
      <Head>
        <title>Synapsy Assistant</title>
        <meta name="description" content="Your personal assistant" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>
        <h1>
          Welcome to Synapsy
        </h1>
        <p>Your personal assistant is getting ready.</p>
      </main>
    </>
  );
}