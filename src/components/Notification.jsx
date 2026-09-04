import { useEffect, useState } from "react";

function Notification() {

  const defects = [

    {
      icon:"🔴",
      title:"Crack Detected",
      zone:"Zone A",
      confidence:"98%"
    },

    {
      icon:"🟠",
      title:"Corrosion",
      zone:"Zone B",
      confidence:"96%"
    },

    {
      icon:"🟢",
      title:"Algae",
      zone:"Zone C",
      confidence:"94%"
    }

  ];

  const [show,setShow]=useState(false);
  const [data,setData]=useState(defects[0]);

  useEffect(()=>{

    const timer=setInterval(()=>{

      const random=
      defects[Math.floor(Math.random()*defects.length)];

      setData(random);

      setShow(true);

      setTimeout(()=>{

        setShow(false);

      },4000);

    },12000);

    return ()=>clearInterval(timer);

  },[]);

  return(

    <>

      {show &&

      <div className="notification">

        <h2>{data.icon} AI ALERT</h2>

        <h3>{data.title}</h3>

        <p>{data.zone}</p>

        <p>Confidence : {data.confidence}</p>

      </div>

      }

    </>

  );

}

export default Notification;