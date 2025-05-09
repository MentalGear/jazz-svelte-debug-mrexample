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

  // const { me } = useAccount()
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
  // const itemImagesId = me?.root?._refs.itemImages.id
  const itemImagesId = $derived(me?.root?._refs.itemImages.id)
  const itemImages = $derived(
    useCoState(ListOfItemImages, itemImagesId, {
      resolve: {
        $each: true,
      },
    })
  )
  // const itemImages = useCoState(ListOfItemImages, itemImagesId, {
  //   resolve: {
  //     $each: true,
  //   },
  // })

  $inspect(itemImages).with(console.log)

  const makeUrl = (imageDefinition) => {
    if (!imageDefinition) {
      return console.error('not ready yet')
    }

    const targetWidth = window.innerWidth
    const appropriateRes = imageDefinition.highestResAvailable({ targetWidth })
    // if (!appropriateRes) throw new Error(`no resolution found: ${appropriateRes}`)
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

<h1 class="mb-20 text-5xl">MRE Svelte Jazz</h1>

<button onclick={addImage}>Click : add new image</button>

<!-- Image List -->
<div class="space-y-4">
  {#if itemImages.current && itemImages.current.length > 0}
    {#each itemImages.current as itemImage (itemImage?.id)}
      {@const imageUrlFromBlob = makeUrl(itemImage?.image) ?? ''}
      {#if itemImage?.image}
        <div class="border p-2">
          <p>{itemImage.id}</p>
          <img src={imageUrlFromBlob} alt="example" class="h-auto max-w-full" />
        </div>
      {/if}
    {/each}
  {:else}
    <p class="text-center text-gray-500">No images yet</p>
  {/if}
</div>
