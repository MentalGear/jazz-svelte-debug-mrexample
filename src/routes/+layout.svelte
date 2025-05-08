<!-- Register the Account schema so `useAccount` returns our custom `AppAccount` -->
<script lang="ts" module>
  declare module 'jazz-svelte' {
    interface Register {
      Account: AppAccount
    }
  }
</script>

<script lang="ts">
  import { onMount } from 'svelte'
  import '../app.css'
  import { ModeWatcher } from 'mode-watcher'
  import { JazzProvider } from 'jazz-svelte'
  import { AppAccount } from '$lib/data/schema' // Import your schema
  let { children } = $props()

  onMount(() => {
    // prevent default browser navigating to file url. This may happen if the user misses a drop zone.
    const preventDefaultDrop = (event: DragEvent) => {
      event.preventDefault()
    }
    window.addEventListener('dragover', preventDefaultDrop)
    window.addEventListener('drop', preventDefaultDrop)
    return () => {
      window.removeEventListener('dragover', preventDefaultDrop)
      window.removeEventListener('drop', preventDefaultDrop)
    }
  })
</script>

<JazzProvider
  sync={{
    // TODO: later put in key
    peer: 'wss://cloud.jazz.tools/?key=YOUR_API_KEY', // Replace with your actual Jazz Cloud key or server address
    when: 'signedUp', // Run sync only when signed up
  }}
  AccountSchema={AppAccount}
>
  <ModeWatcher defaultMode="dark" />
  <main>
    {@render children?.()}
  </main>
</JazzProvider>
