<!--
  Greeting.svelte
  A simple greeting component for the Hello World extension
-->
<script>
  // Props
  export let message = 'Hello, World!';
  export let showTimestamp = true;
  export let textColor = 'default';
  
  // Computed
  $: timestamp = new Date().toLocaleTimeString();
  
  // Map color names to Tailwind classes
  $: textColorClass = {
    'default': 'text-foreground',
    'primary': 'text-primary',
    'secondary': 'text-secondary',
    'accent': 'text-accent'
  }[textColor] || 'text-foreground';
</script>

<div class="p-4 border rounded-md bg-card">
  <h3 class="text-lg font-semibold mb-2 {textColorClass}">
    {message}
  </h3>
  
  {#if showTimestamp}
    <p class="text-sm text-muted-foreground">
      Current time: {timestamp}
    </p>
  {/if}
  
  <p class="text-sm mt-2">
    This component is provided by the Hello World extension.
  </p>
</div>
