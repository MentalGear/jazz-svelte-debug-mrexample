<script lang="ts">
  import { AppAccount, ItemImage, ListOfItemImages } from '$lib/data/schema'
  import { useAccount, useCoState } from 'jazz-svelte'

  import { browser } from '$app/environment'
  import { Group } from 'jazz-tools'
  import { createImage } from 'jazz-browser-media-images'

  const urlToObject = async (url: string) => {
    const response = await fetch(url)
    // here image is url/location of image
    const blob = await response.blob()
    const file = new File([blob], 'image.jpg', { type: blob.type })
    console.log(file)
    return file
  }

  const { me } = $derived(useAccount({ resolve: { root: { itemImages: true } } }))

  // let currentAccount = $derived<AppAccount | undefined>(me instanceof AppAccount ? me : undefined)
  let currentAccount = $derived<AppAccount | undefined>(me instanceof AppAccount ? me : undefined)

  async function addImage() {
    if (!currentAccount) return

    const someImage = await urlToObject('https://picsum.photos/200/300')

    let itemImage

    try {
      // 1. Create a Group for ownership
      const itemImageGroup = Group.create({ owner: currentAccount })

      // 2. Create ImageDefinition for the product image
      const jazzImageDef = await createImage(someImage, {
        owner: itemImageGroup,
        // maxSize // if undefined, generates all default sizes including original
      })

      // 3. Create ItemImage
      const itemImageData = {
        image: jazzImageDef,
        dateAdded: new Date(),
        dateUpdated: new Date(),
      }

      itemImage = ItemImage.create(itemImageData, { owner: itemImageGroup })
    } catch (error) {
      console.error('Error creating ItemImage:', error)
      // Optionally provide user feedback on error
      return null
    }

    if (!itemImage) return console.error('Failed to create ItemImage')

    // Ensure the root and itemImages list are loaded before pushing
    const { root } = await currentAccount.ensureLoaded({
      resolve: { root: { itemImages: true } },
    })

    // Add the new ItemImage to the user's list of item images
    root.itemImages.push(itemImage)
  }

  // ========================================================================
  // ========================================================================
  // ========================================================================

  // retrieve images
  const itemImagesId = $derived(me?.root?._refs.itemImages.id)
  const itemImages = $derived(
    useCoState(ListOfItemImages, itemImagesId, {
      resolve: {
        $each: true,
      },
    })
  )

  $inspect(itemImages).with(console.log)

  const makeUrl = (imageDefinition) => {
    if (!imageDefinition) {
      return console.error('not ready yet')
    }

    const targetWidth = window.innerWidth
    const appropriateRes = imageDefinition.highestResAvailable({ targetWidth })
    if (!appropriateRes) return imageDefinition.placeholderDataURL
    // debugger
    console.log(`Found highest resolution: ${appropriateRes.res}`)

    const blob = appropriateRes.stream.toBlob()
    if (!blob) throw new Error(`Couldnt make Blob from appropriateRes`)

    if (!browser) throw new Error(`URL.createObjectURL(blob) only available in browser`)
    const imageUrlFromBlob = URL.createObjectURL(blob)

    return imageUrlFromBlob
  }
</script>

<div class="relative my-4 flex flex-col gap-2">
  <h1 class="m-5 text-5xl">Jazz Svelte Example</h1>

  <p class="m-4 mb-4 bg-white/10 p-4">
    Store and load jazz images (including auto sizes & low-res placeholder)
  </p>

  <button class="overflow-hidden rounded-xl bg-blue-500 p-4" onclick={addImage}>
    Load image from URL & store as Jazz Image</button
  >

  <button
    class="max-w-[400px] self-center overflow-hidden rounded-xl bg-red-800/50 p-2"
    onclick={() => {
      localStorage.clear()
      indexedDB.databases().then((dbs) => dbs.forEach((db) => indexedDB.deleteDatabase(db.name)))
      window.location.reload()
    }}
  >
    Clear LocalStorage & indexdb & reload
  </button>
</div>

<!-- Image List -->
<div class="space-y-4">
  {#if itemImages.current && itemImages.current.length > 0}
    {@const reveresedList = itemImages.current.toReversed()}
    {#each reveresedList as itemImage (itemImage?.id)}
      {@const imageUrlFromBlob = makeUrl(itemImage?.image) ?? ''}
      {#if itemImage?.image}
        <div class="border p-2">
          <p>{itemImage.id}</p>
          <img src={imageUrlFromBlob} alt="example" class="h-auto max-w-full" />
        </div>
      {/if}
    {/each}
  {:else}
    <p class="p-10 text-center text-xl">No images yet</p>
  {/if}
</div>
