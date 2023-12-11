import { Fireworks, FireworksHandlers } from '@fireworks-js/react'
import { useState, useEffect, useRef, FormEvent } from 'react'
import api from '../services/ApiService'
import { ReactComponent as CosmonicLogo } from '../assets/cosmonic-logo.svg'
import { ReactComponent as GithubLogo } from '../assets/github-logo.svg'
import { useScreenSize } from '../hooks/useScreenSize'

function updateRQParams (key:string, value:string) {
    const search = new URLSearchParams(window.location.search);
    search.set(key,value); 
    window.history.replaceState({}, "", window.location.protocol+ '//' + window.location.host + window.location.pathname + '?' + search.toString());
}


interface Params extends URLSearchParams {
 bucket: string | undefined
}

function App() {

  const params = new Proxy(new URLSearchParams(window.location.search) as Params, {
 get: (searchParams: Params, prop: string): string | null => searchParams.get(prop),
});
  let init_bucket:string  = params.bucket??'EMPTY'; 

  const [bucket, setBucket] = useState(()=>init_bucket)
  const [count, setCount] = useState(()=>0)
  const dimensions = useScreenSize()
  const fireworks = useRef<FireworksHandlers>(null)


  const updateCount = async (key?: string) => {
    try {
      const response = await api.increment(key)
      setCount(response.counter)
      return response.counter
    } catch (err) {
      console.log(err)
    }
  }

  const launch = (total: number) => {
    fireworks.current?.launch(total > 50 ? 50 : total)
  }

  useEffect(() => {
    fireworks.current?.updateSize(dimensions)
  }, [dimensions])

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    let workingTotal = count
    const el = e.currentTarget.elements.namedItem('bucket') as HTMLInputElement
    const newBucket = el?.value ?? ''
    if (newBucket !== bucket) {
      workingTotal = 0
    }
    updateCount(newBucket).then((newCount) => {
      setBucket(newBucket);
      updateRQParams('bucket',newBucket);
      launch(newCount - workingTotal)
    })
  }

  useEffect(()=>{
     try {
      (async ()=>{
       const response = await api.getCount(bucket);
       setCount(response.counter);
      })();
    } catch (err) {
      console.log(err)
    }
},[bucket]);

  return (
    <div className="h-full grid grid-rows-[1fr,auto]">
      <div className="flex flex-col gap-2 h-full items-center justify-center">
        <form className="flex flex-wrap gap-2" onSubmit={handleSubmit}>
          <input
            id="bucket"
            name="bucket"
            placeholder="Enter a bucket name"
            value={bucket}
            onChange={({target:{value}})=>setBucket(value)}
            className="mx-auto px-2 py-1.5 text-center w-56 max-w-full text-cosmonicGray rounded-md border border-cosmonicPurple-light"
          />
          <button
            type="submit"
            className="bg-cosmonicPurple-light w-56 max-w-full rounded-md hover:bg-cosmonicPurple-dark text-white font-bold py-2 px-4 my-auto mx-auto"
          >
            Increment
          </button>
        </form>
        <h2 className={`text-7xl mt-5 mx-auto font-bolder text-cosmonicPurple-light ${count===0 && 'invisible'}`}>
          {count}
        </h2>
      </div>
      <Fireworks
        ref={fireworks}
        autostart={false}
        className="absolute inset-0 h-full w-full -z-10"
      />
    </div>
  )
}

export default App
